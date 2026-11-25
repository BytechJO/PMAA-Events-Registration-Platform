import { devSignInEnabled } from "@pmaa/core";
import { DEV_ROLE_COOKIE, isDevChoice } from "./dev-session";

/*
 * POST /api/dev/sign-in (form field "role") and POST /api/dev/sign-out, for the local test sign-in.
 * Both answer 404 unless ADMIN_DEV_SIGN_IN is on (localhost only), so they do not exist on staging.
 */

type Env = Record<string, string | undefined>;
const notFound = () => new Response("Not found", { status: 404 });

function cookieAttributes(req: Request, maxAge: number) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function redirect(req: Request, path: string, cookie: string) {
  return new Response(null, { status: 303, headers: { location: new URL(path, req.url).toString(), "set-cookie": cookie } });
}

export function devSignInHandler(env: () => Env = () => process.env) {
  return async (req: Request): Promise<Response> => {
    if (!devSignInEnabled(env())) return notFound();
    const role = (await req.formData()).get("role");
    if (!isDevChoice(role)) return new Response("Unknown role", { status: 400 });
    return redirect(req, "/admin/events", `${DEV_ROLE_COOKIE}=${role}; ${cookieAttributes(req, 60 * 60 * 8)}`);
  };
}

export function devSignOutHandler(env: () => Env = () => process.env) {
  return async (req: Request): Promise<Response> => {
    if (!devSignInEnabled(env())) return notFound();
    return redirect(req, "/admin", `${DEV_ROLE_COOKIE}=; ${cookieAttributes(req, 0)}`);
  };
}
