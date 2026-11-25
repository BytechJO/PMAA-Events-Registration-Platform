import { idempotencyKey } from "@pmaa/core";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "./client";
import { runMigrations } from "./migrate";
import { enqueueOutbox, inTransaction, recordAudit } from "./patterns";
import { auditLog, outboxMessages } from "./schema";

/*
 * Integration tests on a real PostgreSQL (TEST_DATABASE_URL). Locally: docker compose up -d db.
 * CI sets REQUIRE_DB_TESTS=1, so these tests can never be skipped there by accident.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url && process.env.REQUIRE_DB_TESTS === "1") throw new Error("TEST_DATABASE_URL is required in CI");

describe.skipIf(!url)("transaction + audit + outbox pattern", () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const conn = createDb(url!);
    db = conn.db;
    close = () => conn.pool.end();
    await runMigrations(db);
    await runMigrations(db); // a second run must be a no-op
  });

  beforeEach(async () => {
    await db.execute(sql`truncate table ${outboxMessages}, ${auditLog}`);
  });

  afterAll(async () => close?.());

  const message = (entityId: string) => ({
    kind: "email.confirmation",
    idempotencyKey: idempotencyKey("email", "confirmation", entityId, 1),
    payload: { registrationId: entityId },
    correlationId: "corr-1",
  });
  const audit = (entityId: string) => ({
    actorId: "admin-1",
    action: "registration.created",
    entityType: "registration",
    entityId,
    after: { status: "confirmed" },
    correlationId: "corr-1",
  });

  it("commits the audit entry and the outbox message together", async () => {
    await inTransaction(db, async (tx) => {
      await recordAudit(tx, audit("reg_1"));
      await enqueueOutbox(tx, message("reg_1"));
    });
    expect(await db.select().from(auditLog)).toHaveLength(1);
    const [row] = await db.select().from(outboxMessages);
    expect(row?.status).toBe("pending");
  });

  it("rolls both back when the work fails", async () => {
    await expect(
      inTransaction(db, async (tx) => {
        await recordAudit(tx, audit("reg_2"));
        await enqueueOutbox(tx, message("reg_2"));
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(await db.select().from(outboxMessages)).toHaveLength(0);
  });

  it("ignores a second message with the same idempotency key (a retried request cannot send twice)", async () => {
    for (let i = 0; i < 3; i++) {
      await inTransaction(db, (tx) => enqueueOutbox(tx, message("reg_3")));
    }
    expect(await db.select().from(outboxMessages)).toHaveLength(1);
  });
});
