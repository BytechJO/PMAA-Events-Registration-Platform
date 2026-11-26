import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, smallint, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/*
 * Database schema (spec §12). Times are stored in UTC (timestamptz) and shown in the session's zone.
 * Rows that are history (registrations, their answers and consents, message deliveries) use restrictive
 * foreign keys: an event with registrations cannot be deleted, it is archived instead (spec §11.4).
 */

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () =>
  ts("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ---------- States (spec §11). Postgres enums, so the database refuses an unknown state too. ---------- */

export const eventTypes = ["online", "in_person"] as const;
/** Events and sessions share one life cycle: DRAFT → PUBLISHED → CLOSED → COMPLETED → ARCHIVED, or CANCELLED (§11.1). */
export const eventStatuses = ["draft", "published", "closed", "completed", "archived", "cancelled"] as const;
/**
 * Every registration state of both event types (§11.2). Online: submitted, confirmed, waitlisted, cancelled.
 * In person: pending, approved, rejected, waitlisted, cancelled. Which transitions are allowed per type is
 * the services' job (T022, T050).
 */
export const registrationStatuses = ["submitted", "pending", "confirmed", "approved", "rejected", "waitlisted", "cancelled"] as const;
/** States that no longer hold a place: the same email may register again for that session. */
export const inactiveRegistrationStatuses = ["cancelled", "rejected"] as const;
export const registrationSources = ["public_form", "admin", "import"] as const;
/** Online certificate rule per event (§2, T066). In-person certificates always need confirmed attendance. */
export const certificateRules = ["registered", "attended", "manual"] as const;
export const adminUserStatuses = ["active", "disabled"] as const;
export const messageChannels = ["email", "whatsapp"] as const;
/** Email and WhatsApp delivery states together (§11.3); each channel uses its own subset. */
export const deliveryStatuses = ["queued", "accepted", "sent", "delivered", "read", "bounced", "failed", "suppressed"] as const;

export const eventType = pgEnum("event_type", eventTypes);
export const eventStatus = pgEnum("event_status", eventStatuses);
export const registrationStatus = pgEnum("registration_status", registrationStatuses);
export const registrationSource = pgEnum("registration_source", registrationSources);
export const certificateRule = pgEnum("certificate_rule", certificateRules);
export const adminUserStatus = pgEnum("admin_user_status", adminUserStatuses);
export const messageChannel = pgEnum("message_channel", messageChannels);
export const deliveryStatus = pgEnum("delivery_status", deliveryStatuses);

/* ---------- Admins and roles (spec §3, §9) ---------- */

/** PMAA staff who sign in with Microsoft Entra ID (T011). Teachers never sign in. */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Set on the first Microsoft sign-in; until then the allowlist matches by email. */
    entraObjectId: text("entra_object_id").unique(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    status: adminUserStatus("status").notNull().default("active"),
    lastLoginAt: ts("last_login_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("admin_users_email_lower_uq").on(sql`lower(${t.email})`)],
);

/** The four admin roles; keys match `roles` in @pmaa/core and are seeded by migration 0002. */
export const roles = pgTable("roles", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
});

/* ---------- Events and sessions (spec §5) ---------- */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: eventType("type").notNull(),
    title: text("title").notNull(),
    /** Public address: /webinars/{slug}. Lowercase words joined by hyphens. */
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    program: text("program"),
    bannerUrl: text("banner_url"),
    status: eventStatus("status").notNull().default("draft"),
    certificateRule: certificateRule("certificate_rule").notNull().default("attended"),
    /** Share of the session a teacher must attend for the "attended" rule (doc 08 event editor; default 50%). */
    minAttendancePercent: smallint("min_attendance_percent").notNull().default(50),
    ownerId: uuid("owner_id").references(() => adminUsers.id, { onDelete: "restrict" }),
    publishedAt: ts("published_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("events_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("events_min_attendance_range", sql`${t.minAttendancePercent} between 0 and 99`),
    index("events_status_idx").on(t.status),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** A draft event can be deleted with its sessions; once a registration exists the delete is blocked below. */
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    title: text("title"),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at").notNull(),
    /** IANA name, e.g. Asia/Amman; times are shown in this zone. */
    timeZone: text("time_zone").notNull(),
    /** Null means no limit. */
    capacity: integer("capacity"),
    status: eventStatus("status").notNull().default("draft"),
    registrationOpensAt: ts("registration_opens_at"),
    registrationClosesAt: ts("registration_closes_at"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    venueMapUrl: text("venue_map_url"),
    presenter: text("presenter"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("sessions_ends_after_starts", sql`${t.endsAt} > ${t.startsAt}`),
    check("sessions_capacity_positive", sql`${t.capacity} is null or ${t.capacity} > 0`),
    check(
      "sessions_registration_window",
      sql`${t.registrationOpensAt} is null or ${t.registrationClosesAt} is null or ${t.registrationClosesAt} >= ${t.registrationOpensAt}`,
    ),
    index("sessions_starts_at_idx").on(t.startsAt),
    index("sessions_event_status_idx").on(t.eventId, t.status),
  ],
);

/* ---------- Teachers and their registrations (spec §6, §12) ---------- */

/** One row per person, found by normalized email (case-insensitive). Identity fields live here, not on each registration. */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    normalizedEmail: text("normalized_email").notNull(),
    /** Exactly as typed, after sanitizing; printed on the certificate. */
    fullName: text("full_name").notNull(),
    /** Kept apart because Graph needs them for the Teams registration (question B1). */
    firstName: text("first_name"),
    lastName: text("last_name"),
    phoneE164: text("phone_e164"),
    /** ISO 3166-1 alpha-2. */
    country: text("country"),
    institution: text("institution"),
    jobRole: text("job_role"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("contacts_email_lower_uq").on(sql`lower(${t.normalizedEmail})`),
    check("contacts_phone_e164", sql`${t.phoneE164} is null or ${t.phoneE164} ~ '^\\+[1-9][0-9]{6,14}$'`),
    check("contacts_country_iso2", sql`${t.country} is null or ${t.country} ~ '^[A-Z]{2}$'`),
  ],
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "restrict" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "restrict" }),
    status: registrationStatus("status").notNull(),
    source: registrationSource("source").notNull().default("public_form"),
    submittedAt: ts("submitted_at").notNull().defaultNow(),
    comments: text("comments"),
    /** Approval fields (in-person, T050). */
    decidedBy: uuid("decided_by").references(() => adminUsers.id, { onDelete: "restrict" }),
    decidedAt: ts("decided_at"),
    decisionReason: text("decision_reason"),
    /** Hash of the secure token for the status and cancel page (T025); the token itself is never stored. */
    cancelTokenHash: text("cancel_token_hash").unique(),
    cancelledAt: ts("cancelled_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // FR-004: one active registration per person per session. Cancelled or rejected ones free the place.
    uniqueIndex("registrations_active_per_session_uq")
      .on(t.sessionId, t.contactId)
      .where(sql`status not in ('cancelled', 'rejected')`),
    index("registrations_session_status_idx").on(t.sessionId, t.status),
    index("registrations_contact_idx").on(t.contactId),
  ],
);

/** Form answers beyond the contact fields, versioned with the form schema. */
export const registrationAnswers = pgTable(
  "registration_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "restrict" }),
    fieldKey: text("field_key").notNull(),
    value: jsonb("value").notNull(),
    formSchemaVersion: integer("form_schema_version").notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("registration_answers_field_uq").on(t.registrationId, t.fieldKey)],
);

/** Consent as given (spec §18): append-only, a withdrawal is a new row with granted = false. */
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "restrict" }),
    channel: messageChannel("channel").notNull(),
    consentTextVersion: text("consent_text_version").notNull(),
    granted: boolean("granted").notNull(),
    recordedAt: ts("recorded_at").notNull().defaultNow(),
    sourcePage: text("source_page"),
    ipHash: text("ip_hash"),
  },
  (t) => [index("consent_records_registration_idx").on(t.registrationId)],
);

/** One message to one teacher on one channel, with its provider status (spec §11.3, §17). */
export const messageDeliveries = pgTable(
  "message_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "restrict" }),
    /** confirmation, reminder_24h, approval, certificate, ... */
    purpose: text("purpose").notNull(),
    channel: messageChannel("channel").notNull(),
    templateVersion: text("template_version"),
    status: deliveryStatus("status").notNull().default("queued"),
    providerMessageId: text("provider_message_id"),
    /** A retried job finds its own row and never sends twice. */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    acceptedAt: ts("accepted_at"),
    deliveredAt: ts("delivered_at"),
    failedAt: ts("failed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("message_deliveries_provider_uq").on(t.channel, t.providerMessageId),
    index("message_deliveries_status_idx").on(t.status, t.createdAt),
    index("message_deliveries_registration_idx").on(t.registrationId),
  ],
);

/** Role grants. A null event means all events; otherwise the grant covers one event (spec §12 "optionally event-scoped"). */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    roleKey: text("role_key")
      .notNull()
      .references(() => roles.key, { onDelete: "restrict" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    grantedBy: uuid("granted_by").references(() => adminUsers.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (t) => [
    // nulls not distinct: the same global grant cannot be added twice either.
    unique("user_roles_grant_uq").on(t.userId, t.roleKey, t.eventId).nullsNotDistinct(),
    index("user_roles_event_idx").on(t.eventId),
  ],
);

/* ---------- Infrastructure every feature uses (T005) ---------- */

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

/* ---------- Row types for the services ---------- */

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type RegistrationAnswer = typeof registrationAnswers.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type MessageDelivery = typeof messageDeliveries.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type RegistrationStatus = (typeof registrationStatuses)[number];
export type EventStatus = (typeof eventStatuses)[number];
