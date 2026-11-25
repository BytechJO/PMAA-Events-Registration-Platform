import { devSignOutHandler } from "@/server/dev-sign-in";

/** Local test sign-out (ADMIN_DEV_SIGN_IN on localhost only); 404 everywhere else. */
export const POST = devSignOutHandler();
