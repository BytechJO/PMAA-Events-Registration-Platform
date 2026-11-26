-- The four admin roles (spec §3). Keys must match `roles` in packages/core/src/roles.ts (checked by schema.test.ts).
INSERT INTO "roles" ("key", "label") VALUES
  ('super_admin', 'Super Admin'),
  ('event_admin', 'Event Admin'),
  ('attendance_manager', 'Attendance Manager'),
  ('read_only', 'Read-only')
ON CONFLICT ("key") DO NOTHING;
