import { devSignInHandler } from "@/server/dev-sign-in";

/** Local test sign-in (ADMIN_DEV_SIGN_IN on localhost only); 404 everywhere else. */
export const POST = devSignInHandler();
