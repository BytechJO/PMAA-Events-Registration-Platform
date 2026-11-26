CREATE TYPE "public"."admin_user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."certificate_rule" AS ENUM('registered', 'attended', 'manual');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('queued', 'accepted', 'sent', 'delivered', 'read', 'bounced', 'failed', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'closed', 'completed', 'archived', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('online', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."registration_source" AS ENUM('public_form', 'admin', 'import');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('submitted', 'pending', 'confirmed', 'approved', 'rejected', 'waitlisted', 'cancelled');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entra_object_id" text,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" "admin_user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_entra_object_id_unique" UNIQUE("entra_object_id")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"channel" "message_channel" NOT NULL,
	"consent_text_version" text NOT NULL,
	"granted" boolean NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_page" text,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_email" text NOT NULL,
	"full_name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone_e164" text,
	"country" text,
	"institution" text,
	"job_role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_phone_e164" CHECK ("contacts"."phone_e164" is null or "contacts"."phone_e164" ~ '^\+[1-9][0-9]{6,14}$'),
	CONSTRAINT "contacts_country_iso2" CHECK ("contacts"."country" is null or "contacts"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"program" text,
	"banner_url" text,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"certificate_rule" "certificate_rule" DEFAULT 'attended' NOT NULL,
	"min_attendance_percent" smallint DEFAULT 50 NOT NULL,
	"owner_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_slug_format" CHECK ("events"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "events_min_attendance_range" CHECK ("events"."min_attendance_percent" between 0 and 99)
);
--> statement-breakpoint
CREATE TABLE "message_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"channel" "message_channel" NOT NULL,
	"template_version" text,
	"status" "delivery_status" DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"idempotency_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"accepted_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_deliveries_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "message_deliveries_provider_uq" UNIQUE("channel","provider_message_id")
);
--> statement-breakpoint
CREATE TABLE "registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"field_key" text NOT NULL,
	"value" jsonb NOT NULL,
	"form_schema_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registration_answers_field_uq" UNIQUE("registration_id","field_key")
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "registration_status" NOT NULL,
	"source" "registration_source" DEFAULT 'public_form' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"comments" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_reason" text,
	"cancel_token_hash" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_cancel_token_hash_unique" UNIQUE("cancel_token_hash")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"time_zone" text NOT NULL,
	"capacity" integer,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"registration_opens_at" timestamp with time zone,
	"registration_closes_at" timestamp with time zone,
	"venue_name" text,
	"venue_address" text,
	"venue_map_url" text,
	"presenter" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_ends_after_starts" CHECK ("sessions"."ends_at" > "sessions"."starts_at"),
	CONSTRAINT "sessions_capacity_positive" CHECK ("sessions"."capacity" is null or "sessions"."capacity" > 0),
	CONSTRAINT "sessions_registration_window" CHECK ("sessions"."registration_opens_at" is null or "sessions"."registration_closes_at" is null or "sessions"."registration_closes_at" >= "sessions"."registration_opens_at")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_key" text NOT NULL,
	"event_id" uuid,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_grant_uq" UNIQUE NULLS NOT DISTINCT("user_id","role_key","event_id")
);
--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_admin_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_deliveries" ADD CONSTRAINT "message_deliveries_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_decided_by_admin_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_key_roles_key_fk" FOREIGN KEY ("role_key") REFERENCES "public"."roles"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_admin_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_lower_uq" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "consent_records_registration_idx" ON "consent_records" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_email_lower_uq" ON "contacts" USING btree (lower("normalized_email"));--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_deliveries_status_idx" ON "message_deliveries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "message_deliveries_registration_idx" ON "message_deliveries" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_active_per_session_uq" ON "registrations" USING btree ("session_id","contact_id") WHERE status not in ('cancelled', 'rejected');--> statement-breakpoint
CREATE INDEX "registrations_session_status_idx" ON "registrations" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "registrations_contact_idx" ON "registrations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sessions_starts_at_idx" ON "sessions" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "sessions_event_status_idx" ON "sessions" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "user_roles_event_idx" ON "user_roles" USING btree ("event_id");