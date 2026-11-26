import { roles as coreRoles } from "@pmaa/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "./client";
import { runMigrations } from "./migrate";
import {
  adminUsers,
  consentRecords,
  contacts,
  events,
  messageDeliveries,
  registrationAnswers,
  registrations,
  roles,
  sessions,
  userRoles,
  type RegistrationStatus,
} from "./schema";

/*
 * T010 constraints, indexes and foreign keys on real PostgreSQL (TEST_DATABASE_URL).
 * Locally: docker compose up -d db. CI sets REQUIRE_DB_TESTS=1, so these never skip there.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url && process.env.REQUIRE_DB_TESTS === "1") throw new Error("TEST_DATABASE_URL is required in CI");

/** The Postgres error behind a failed query: its SQLSTATE code and the constraint it hit. */
async function pgError(work: Promise<unknown>): Promise<{ code?: string; constraint?: string }> {
  try {
    await work;
  } catch (e) {
    const cause = ((e as { cause?: unknown }).cause ?? e) as { code?: string; constraint?: string };
    return { code: cause.code, constraint: cause.constraint };
  }
  throw new Error("expected the query to fail");
}

const UNIQUE = "23505";
const FOREIGN_KEY = "23503";
const CHECK = "23514";

describe.skipIf(!url)("schema v1 constraints", () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const conn = createDb(url!);
    db = conn.db;
    close = () => conn.pool.end();
    await runMigrations(db);
  });

  beforeEach(async () => {
    // Everything except the seeded roles table.
    await db.execute(
      sql`truncate table ${userRoles}, ${messageDeliveries}, ${consentRecords}, ${registrationAnswers}, ${registrations}, ${contacts}, ${sessions}, ${events}, ${adminUsers} cascade`,
    );
  });

  afterAll(async () => close?.());

  async function eventWithSession(slug = "grow-webinar") {
    const [event] = await db.insert(events).values({ type: "online", title: "GROW webinar", slug }).returning();
    const [session] = await db
      .insert(sessions)
      .values({ eventId: event!.id, startsAt: new Date("2027-03-14T12:00:00Z"), endsAt: new Date("2027-03-14T13:00:00Z"), timeZone: "Asia/Amman" })
      .returning();
    return { event: event!, session: session! };
  }

  async function contact(email = "lina@school.example") {
    const [c] = await db.insert(contacts).values({ normalizedEmail: email, fullName: "Lina Haddad" }).returning();
    return c!;
  }

  const register = (sessionId: string, contactId: string, status: RegistrationStatus = "confirmed") =>
    db.insert(registrations).values({ sessionId, contactId, status }).returning();

  describe("one registration per email per session (FR-004)", () => {
    it("rejects a second active registration for the same person and session", async () => {
      const { session } = await eventWithSession();
      const c = await contact();
      await register(session.id, c.id);
      expect(await pgError(register(session.id, c.id, "submitted"))).toEqual({ code: UNIQUE, constraint: "registrations_active_per_session_uq" });
    });

    it("treats the same email in a different case as the same person", async () => {
      await contact("lina@school.example");
      expect(await pgError(contact("Lina@School.Example"))).toEqual({ code: UNIQUE, constraint: "contacts_email_lower_uq" });
    });

    it("lets a person register again after a cancellation or a rejection", async () => {
      const { session } = await eventWithSession();
      const c = await contact();
      await register(session.id, c.id, "cancelled");
      await register(session.id, c.id, "rejected");
      await register(session.id, c.id, "confirmed");
      expect(await db.select().from(registrations)).toHaveLength(3);
    });

    it("lets the same person register for two sessions", async () => {
      const { event, session } = await eventWithSession();
      const [second] = await db
        .insert(sessions)
        .values({ eventId: event.id, startsAt: new Date("2027-03-20T12:00:00Z"), endsAt: new Date("2027-03-20T13:00:00Z"), timeZone: "Asia/Amman" })
        .returning();
      const c = await contact();
      await register(session.id, c.id);
      await register(second!.id, c.id);
      expect(await db.select().from(registrations)).toHaveLength(2);
    });
  });

  describe("events and sessions", () => {
    it("rejects a duplicate slug", async () => {
      await eventWithSession("grow-webinar");
      expect(await pgError(db.insert(events).values({ type: "in_person", title: "Other", slug: "grow-webinar" }))).toEqual({
        code: UNIQUE,
        constraint: "events_slug_unique",
      });
    });

    it("accepts only lowercase words joined by hyphens as a slug", async () => {
      for (const slug of ["GROW-Webinar", "grow webinar", "-grow", "grow--webinar", ""]) {
        expect([slug, await pgError(db.insert(events).values({ type: "online", title: "x", slug }))]).toEqual([slug, { code: CHECK, constraint: "events_slug_format" }]);
      }
    });

    it("blocks deleting an event that has registrations (archive instead, spec §11.4)", async () => {
      const { event, session } = await eventWithSession();
      await register(session.id, (await contact()).id);
      expect((await pgError(db.delete(events).where(eq(events.id, event.id)))).code).toBe(FOREIGN_KEY);
      expect((await pgError(db.delete(sessions).where(eq(sessions.id, session.id)))).code).toBe(FOREIGN_KEY);
      expect(await db.select().from(events)).toHaveLength(1);
    });

    it("deletes a draft event without registrations, with its sessions and event-scoped grants", async () => {
      const { event } = await eventWithSession();
      const [admin] = await db.insert(adminUsers).values({ email: "staff@pmaa.example", displayName: "Staff" }).returning();
      await db.insert(userRoles).values({ userId: admin!.id, roleKey: "event_admin", eventId: event.id });
      await db.delete(events).where(eq(events.id, event.id));
      expect(await db.select().from(sessions)).toHaveLength(0);
      expect(await db.select().from(userRoles)).toHaveLength(0);
      expect(await db.select().from(adminUsers)).toHaveLength(1);
    });

    it("rejects a session that ends before it starts, and a capacity below 1", async () => {
      const { event } = await eventWithSession();
      const base = { eventId: event.id, timeZone: "Asia/Amman", startsAt: new Date("2027-03-14T12:00:00Z") };
      expect(await pgError(db.insert(sessions).values({ ...base, endsAt: new Date("2027-03-14T11:00:00Z") }))).toEqual({
        code: CHECK,
        constraint: "sessions_ends_after_starts",
      });
      expect(await pgError(db.insert(sessions).values({ ...base, endsAt: new Date("2027-03-14T13:00:00Z"), capacity: 0 }))).toEqual({
        code: CHECK,
        constraint: "sessions_capacity_positive",
      });
    });

    it("rejects a registration window that closes before it opens", async () => {
      const { event } = await eventWithSession();
      const window = { registrationOpensAt: new Date("2027-03-10T00:00:00Z"), registrationClosesAt: new Date("2027-03-01T00:00:00Z") };
      expect(
        await pgError(
          db.insert(sessions).values({ eventId: event.id, timeZone: "Asia/Amman", startsAt: new Date("2027-03-14T12:00:00Z"), endsAt: new Date("2027-03-14T13:00:00Z"), ...window }),
        ),
      ).toEqual({ code: CHECK, constraint: "sessions_registration_window" });
    });

    it("refuses an unknown state", async () => {
      const { session } = await eventWithSession();
      const error = await pgError(db.execute(sql`update ${sessions} set status = 'paused' where id = ${session.id}`));
      expect(error.code).toBe("22P02"); // invalid input value for enum
    });
  });

  describe("history is kept", () => {
    it("blocks deleting a registration that has answers or consent records", async () => {
      const { session } = await eventWithSession();
      const [reg] = await register(session.id, (await contact()).id);
      await db.insert(registrationAnswers).values({ registrationId: reg!.id, fieldKey: "school", value: "ABS", formSchemaVersion: 1 });
      await db.insert(consentRecords).values({ registrationId: reg!.id, channel: "email", consentTextVersion: "email-v1", granted: true });
      expect((await pgError(db.delete(registrations).where(eq(registrations.id, reg!.id)))).code).toBe(FOREIGN_KEY);
    });

    it("blocks deleting a contact who has registrations", async () => {
      const { session } = await eventWithSession();
      const c = await contact();
      await register(session.id, c.id);
      expect((await pgError(db.delete(contacts).where(eq(contacts.id, c.id)))).code).toBe(FOREIGN_KEY);
    });
  });

  describe("messages", () => {
    it("rejects a second delivery with the same idempotency key (a retried job never sends twice)", async () => {
      const { session } = await eventWithSession();
      const [reg] = await register(session.id, (await contact()).id);
      const delivery = { registrationId: reg!.id, purpose: "confirmation", channel: "email" as const, idempotencyKey: "email:confirmation:r1:1" };
      await db.insert(messageDeliveries).values(delivery);
      expect(await pgError(db.insert(messageDeliveries).values(delivery))).toEqual({ code: UNIQUE, constraint: "message_deliveries_idempotency_key_unique" });
    });
  });

  describe("admins and roles", () => {
    it("has the four roles from @pmaa/core", async () => {
      expect((await db.select().from(roles)).map((r) => r.key).sort()).toEqual([...coreRoles].sort());
    });

    it("treats admin emails case-insensitively", async () => {
      await db.insert(adminUsers).values({ email: "staff@pmaa.example", displayName: "Staff" });
      expect(await pgError(db.insert(adminUsers).values({ email: "STAFF@pmaa.example", displayName: "Staff 2" }))).toEqual({
        code: UNIQUE,
        constraint: "admin_users_email_lower_uq",
      });
    });

    it("rejects the same global grant twice, allows one role per event, and refuses an unknown role", async () => {
      const [admin] = await db.insert(adminUsers).values({ email: "staff@pmaa.example", displayName: "Staff" }).returning();
      const a = (await eventWithSession("event-a")).event;
      const b = (await eventWithSession("event-b")).event;
      await db.insert(userRoles).values({ userId: admin!.id, roleKey: "read_only" });
      expect(await pgError(db.insert(userRoles).values({ userId: admin!.id, roleKey: "read_only" }))).toEqual({ code: UNIQUE, constraint: "user_roles_grant_uq" });
      await db.insert(userRoles).values([
        { userId: admin!.id, roleKey: "event_admin", eventId: a.id },
        { userId: admin!.id, roleKey: "event_admin", eventId: b.id },
      ]);
      expect((await pgError(db.insert(userRoles).values({ userId: admin!.id, roleKey: "owner" }))).code).toBe(FOREIGN_KEY);
    });
  });

  describe("contacts", () => {
    it("accepts E.164 phones and ISO country codes only", async () => {
      await db.insert(contacts).values({ normalizedEmail: "a@x.example", fullName: "A", phoneE164: "+962791234567", country: "JO" });
      expect((await pgError(db.insert(contacts).values({ normalizedEmail: "b@x.example", fullName: "B", phoneE164: "0791234567" }))).constraint).toBe("contacts_phone_e164");
      expect((await pgError(db.insert(contacts).values({ normalizedEmail: "c@x.example", fullName: "C", country: "Jordan" }))).constraint).toBe("contacts_country_iso2");
    });
  });

  it("stores every time as timestamptz (UTC), never a timestamp without a zone", async () => {
    const naive = await db.execute(
      sql`select table_name, column_name from information_schema.columns where table_schema = 'public' and data_type = 'timestamp without time zone'`,
    );
    expect(naive.rows).toEqual([]);
  });
});
