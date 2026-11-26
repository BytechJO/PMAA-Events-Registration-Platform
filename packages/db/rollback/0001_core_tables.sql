-- Rolls back migrations 0001_core_tables and 0002_seed_roles on a developer database (T010).
-- Drizzle has no down migrations; this script is the way back, and schema.int.test.ts proves it works.
-- Never run it on staging or production: it drops every registration.
--
--   psql "$DATABASE_URL" -f packages/db/rollback/0001_core_tables.sql
--
-- Afterwards `pnpm db:migrate` applies 0001 and 0002 again.

BEGIN;

DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "message_deliveries";
DROP TABLE IF EXISTS "consent_records";
DROP TABLE IF EXISTS "registration_answers";
DROP TABLE IF EXISTS "registrations";
DROP TABLE IF EXISTS "contacts";
DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "events";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "admin_users";

DROP TYPE IF EXISTS "public"."admin_user_status";
DROP TYPE IF EXISTS "public"."certificate_rule";
DROP TYPE IF EXISTS "public"."delivery_status";
DROP TYPE IF EXISTS "public"."event_status";
DROP TYPE IF EXISTS "public"."event_type";
DROP TYPE IF EXISTS "public"."message_channel";
DROP TYPE IF EXISTS "public"."registration_source";
DROP TYPE IF EXISTS "public"."registration_status";

-- Forget 0001 and 0002 (their "when" in drizzle/meta/_journal.json), so the migrator applies them again.
DELETE FROM "drizzle"."__drizzle_migrations" WHERE "created_at" >= 1795698767478;

COMMIT;
