import type { AdminSession, Role } from "@pmaa/core";

/*
 * Admin navigation (spec §9, doc 08 core-11). One list decides what each role sees in the menu and
 * which sections it may open. The server checks the same list before rendering a section, so hiding
 * a menu item is never the only protection (CLAUDE.md rule 1).
 */

export type NavKey = "events" | "registrations" | "messages" | "attendance" | "certificates" | "settings" | "audit-log";

export interface NavItem {
  key: NavKey;
  label: string;
  href: `/admin/${string}`;
  section: "main" | "admin";
  /** false: shown grayed out until its ticket lands. */
  available: boolean;
  /** Roles that see the item (Super Admin sees everything). Spec §3.1 permission matrix. */
  roles: readonly Role[];
}

const ALL: readonly Role[] = ["super_admin", "event_admin", "attendance_manager", "read_only"];
const STAFF: readonly Role[] = ["super_admin", "event_admin", "attendance_manager"];

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "events", label: "Events", href: "/admin/events", section: "main", available: true, roles: ALL },
  { key: "registrations", label: "Registrations", href: "/admin/registrations", section: "main", available: true, roles: ALL },
  { key: "messages", label: "Messages", href: "/admin/messages", section: "main", available: false, roles: STAFF }, // T034
  { key: "attendance", label: "Attendance", href: "/admin/attendance", section: "main", available: false, roles: STAFF }, // T060
  { key: "certificates", label: "Certificates", href: "/admin/certificates", section: "main", available: false, roles: STAFF }, // T065
  { key: "settings", label: "Settings", href: "/admin/settings", section: "admin", available: false, roles: ["super_admin"] },
  { key: "audit-log", label: "Audit log", href: "/admin/audit-log", section: "admin", available: false, roles: STAFF },
];

export function canSee(session: AdminSession | null, key: NavKey): boolean {
  const item = NAV_ITEMS.find((i) => i.key === key);
  if (!session || !item) return false;
  return session.grants.some((g) => g.role === "super_admin" || item.roles.includes(g.role));
}

/** The menu for this admin: only items their roles may see, in menu order. */
export function navFor(session: AdminSession | null): NavItem[] {
  return NAV_ITEMS.filter((i) => canSee(session, i.key));
}

/** The menu item a path belongs to, for the active state and breadcrumbs. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
}
