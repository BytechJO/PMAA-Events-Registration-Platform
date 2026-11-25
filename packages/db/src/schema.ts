import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/*
 * Infrastructure tables every feature uses. The domain tables (events, sessions, registrations, ...)
 * come with ticket T010 (schema v1). Times are stored in UTC (timestamptz).
 */

/** Messages to send (email, WhatsApp, Graph calls), written in the same transaction as the change that causes them. */
export const outboxMessages = pgTable(
  "outbox_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    payload: jsonb("payload").notNull(),
    status: text("status", { enum: ["pending", "dispatched", "failed"] }).notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    correlationId: text("correlation_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  },
  (t) => [index("outbox_messages_pending_idx").on(t.status, t.createdAt)],
);

/** Who did what to which record (spec §18). Append-only. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    correlationId: text("correlation_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_entity_idx").on(t.entityType, t.entityId)],
);
