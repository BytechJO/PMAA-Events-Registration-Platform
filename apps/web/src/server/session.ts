import type { AdminSession } from "@pmaa/core";

/**
 * Reads the signed-in admin. Microsoft Entra ID sign-in and the allowlist come with ticket T011;
 * until then nobody is signed in, so every admin route answers 401.
 * Tests pass their own session loader to adminRoute instead.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  return null;
}
