import { ForbiddenError, UnauthorizedError } from "./errors";

/** Admin roles from spec §3. Teachers never sign in. */
export const roles = ["super_admin", "event_admin", "attendance_manager", "read_only"] as const;
export type Role = (typeof roles)[number];

/** A role grant; eventId limits it to one event (spec §12: roles "optionally event-scoped"). */
export interface RoleGrant {
  role: Role;
  eventId?: string;
}

export interface AdminSession {
  userId: string;
  grants: RoleGrant[];
}

/**
 * Every admin route handler starts with this check (server-side, never trust the UI).
 * Super Admins pass everywhere. Other roles pass when the grant is global or matches the event.
 */
export function requireRole(
  session: AdminSession | null | undefined,
  allowed: readonly Role[],
  eventId?: string,
): AdminSession {
  if (!session) throw new UnauthorizedError();
  const ok = session.grants.some((g) => {
    if (g.role === "super_admin") return true;
    if (!allowed.includes(g.role)) return false;
    return g.eventId === undefined || (eventId !== undefined && g.eventId === eventId);
  });
  if (!ok) throw new ForbiddenError();
  return session;
}
