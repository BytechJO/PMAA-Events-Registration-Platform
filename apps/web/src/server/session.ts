import { devSignInEnabled, type AdminSession } from "@pmaa/core";
import { cookies } from "next/headers";
import { DEV_ROLE_COOKIE, devSessionFor } from "./dev-session";

/**
 * Reads the signed-in admin. Microsoft Entra ID sign-in and the allowlist come with ticket T011.
 * Until then nobody is signed in (every admin route answers 401), except with the local test
 * sign-in (ADMIN_DEV_SIGN_IN on localhost), which reads the role picked on the sign-in page.
 * Tests pass their own session loader to adminRoute instead.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  // Read the cookies first, always: it marks every admin page as per-request. Checking the flag first
  // let the build prerender the admin as "signed out", because the flag is off during `next build`.
  const store = await cookies();
  if (!devSignInEnabled()) return null;
  return devSessionFor(store.get(DEV_ROLE_COOKIE)?.value);
}
