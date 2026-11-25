import { describe, expect, it } from "vitest";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { requireRole, type AdminSession } from "./roles";

const session = (grants: AdminSession["grants"]): AdminSession => ({ userId: "u1", grants });

describe("requireRole", () => {
  it("rejects a request without a session as 401", () => {
    expect(() => requireRole(null, ["event_admin"])).toThrow(UnauthorizedError);
  });

  it("lets a Super Admin through everywhere", () => {
    expect(requireRole(session([{ role: "super_admin" }]), ["event_admin"], "evt_1").userId).toBe("u1");
  });

  it("rejects a role that is not allowed as 403 (AT-11: Read-only cannot write)", () => {
    expect(() => requireRole(session([{ role: "read_only" }]), ["event_admin"])).toThrow(ForbiddenError);
  });

  it("limits an event-scoped role to its own event", () => {
    const s = session([{ role: "event_admin", eventId: "evt_1" }]);
    expect(requireRole(s, ["event_admin"], "evt_1").userId).toBe("u1");
    expect(() => requireRole(s, ["event_admin"], "evt_2")).toThrow(ForbiddenError);
    expect(() => requireRole(s, ["event_admin"])).toThrow(ForbiddenError);
  });

  it("lets a global grant act on any event", () => {
    expect(requireRole(session([{ role: "attendance_manager" }]), ["attendance_manager"], "evt_9").userId).toBe("u1");
  });
});
