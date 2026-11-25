import { auditEntry, type AuditEntry } from "@pmaa/core";
import type { Db, Tx } from "./client";
import { auditLog, outboxMessages } from "./schema";

export interface OutboxMessage {
  kind: string;
  idempotencyKey: string;
  payload: unknown;
  correlationId: string;
}

/**
 * Queues a message for the worker. Call it inside the same transaction as the change that causes it,
 * never call a provider (Graph, WhatsApp, email) inside a request. A second message with the same
 * idempotency key is ignored, so a retried request cannot send twice.
 */
export async function enqueueOutbox(tx: Tx, message: OutboxMessage): Promise<void> {
  await tx
    .insert(outboxMessages)
    .values({ ...message, payload: message.payload ?? {} })
    .onConflictDoNothing({ target: outboxMessages.idempotencyKey });
}

/** Writes one audit entry inside the caller's transaction. */
export async function recordAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  const e = auditEntry(entry);
  await tx.insert(auditLog).values({ ...e, before: e.before ?? null, after: e.after ?? null });
}

/**
 * The pattern every service copies: the change, its audit entry and its outbox messages commit together
 * or not at all.
 *
 *   await inTransaction(db, async (tx) => {
 *     const reg = await approveRegistration(tx, id);                       // the change
 *     await recordAudit(tx, { action: "registration.approved", ... });     // who did it
 *     await enqueueOutbox(tx, { kind: "email.approval", idempotencyKey: idempotencyKey("email", "approval", id, 1), ... });
 *   });
 */
export function inTransaction<T>(db: Db, work: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(work);
}
