import { roleLabels, roles, type AdminSession, type Role } from "@pmaa/core";

/*
 * Admin test sign-in for developer machines (ADMIN_DEV_SIGN_IN, localhost only; see devSignInEnabled).
 * The chosen role lives in a cookie; T011 replaces this with Microsoft Entra ID sign-in.
 */

export const DEV_ROLE_COOKIE = "pmaa_dev_role";

/** "none" signs in a user who is on no admin list, to see the "not allowed" page (AT-11). */
export const DEV_CHOICES = [...roles, "none"] as const;
export type DevChoice = (typeof DEV_CHOICES)[number];

export const devChoiceLabels: Record<DevChoice, string> = { ...roleLabels, none: "No role (not on the admin list)" };

export function isDevChoice(value: unknown): value is DevChoice {
  return typeof value === "string" && (DEV_CHOICES as readonly string[]).includes(value);
}

/** The session for a test sign-in cookie value, or null for anything unknown. */
export function devSessionFor(value: string | undefined): AdminSession | null {
  if (!isDevChoice(value)) return null;
  if (value === "none") return { userId: "dev-none", displayName: "Test user", grants: [] };
  const role: Role = value;
  return { userId: `dev-${role}`, displayName: `Test ${roleLabels[role]}`, grants: [{ role }] };
}
