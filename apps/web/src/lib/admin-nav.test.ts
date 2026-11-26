import type { AdminSession, Role } from "@pmaa/core";
import { describe, expect, it } from "vitest";
import { canSee, NAV_ITEMS, navFor, navItemForPath } from "./admin-nav";

const as = (...roles: Role[]): AdminSession => ({ userId: "u", grants: roles.map((role) => ({ role })) });
const keys = (session: AdminSession | null) => navFor(session).map((i) => i.key);

describe("admin navigation per role (spec §3.1, §9)", () => {
  it("shows Super Admin every item, in the core-11 order", () => {
    expect(keys(as("super_admin"))).toEqual(["events", "registrations", "messages", "attendance", "certificates", "settings", "audit-log"]);
  });

  it("hides Settings from Event Admins and Attendance Managers", () => {
    expect(keys(as("event_admin"))).not.toContain("settings");
    expect(keys(as("attendance_manager"))).toEqual(["events", "registrations", "messages", "attendance", "certificates", "audit-log"]);
  });

  it("gives Read-only only the lists it may read", () => {
    expect(keys(as("read_only"))).toEqual(["events", "registrations"]);
  });

  it("shows nothing without a session or without a role (AT-11)", () => {
    expect(keys(null)).toEqual([]);
    expect(keys({ userId: "u", grants: [] })).toEqual([]);
  });

  it("counts an event-scoped grant and combines several roles", () => {
    expect(canSee({ userId: "u", grants: [{ role: "event_admin", eventId: "evt_1" }] }, "messages")).toBe(true);
    expect(keys(as("read_only", "attendance_manager"))).toContain("attendance");
  });

  it("only Events and Registrations are switched on in M1; the rest are grayed out", () => {
    expect(NAV_ITEMS.filter((i) => i.available).map((i) => i.key)).toEqual(["events", "registrations"]);
  });

  it("finds the menu item for a path and its sub-pages", () => {
    expect(navItemForPath("/admin/events")?.key).toBe("events");
    expect(navItemForPath("/admin/events/evt_1/sessions")?.key).toBe("events");
    expect(navItemForPath("/admin/eventsx")).toBeUndefined();
    expect(navItemForPath("/admin")).toBeUndefined();
  });
});
