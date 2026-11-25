import { devSignInEnabled, roleLabels, type AdminSession } from "@pmaa/core";
import type { ReactNode } from "react";
import { AdminForbiddenView } from "@/components/admin/states";
import type { DevChoices, ShellUser } from "@/components/admin/UserMenu";
import { canSee, type NavKey } from "@/lib/admin-nav";
import { DEV_CHOICES, devChoiceLabels } from "./dev-session";
import { getAdminSession } from "./session";

/**
 * Server-side guard for an admin section. Next renders a page even when its layout shows the sign-in
 * screen, so every section checks the session itself before it loads data (CLAUDE.md rule 1).
 */
export async function AdminSection({ navKey, children }: { navKey: NavKey; children: ReactNode }) {
  const session = await getAdminSession();
  if (!session || !canSee(session, navKey)) return <AdminForbiddenView />;
  return children;
}

export function devChoices(): DevChoices {
  return devSignInEnabled() ? DEV_CHOICES.map((value) => ({ value, label: devChoiceLabels[value] })) : null;
}

/** Name, role and initials for the user menu. The highest role wins when an admin has several. */
export function shellUser(session: AdminSession): ShellUser {
  const order = ["super_admin", "event_admin", "attendance_manager", "read_only"] as const;
  const role = order.find((r) => session.grants.some((g) => g.role === r));
  const name = session.displayName ?? "Admin";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return { name, roleLabel: role ? roleLabels[role] : "No role", initials };
}
