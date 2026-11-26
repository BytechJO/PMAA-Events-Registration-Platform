import { z } from "zod";

/**
 * Environment variables, validated once at startup (spec Appendix A).
 * Required values make the process refuse to start when missing; integration values stay optional
 * until PMAA provides them (see the External inputs sheet in the Jira workbook).
 */
const optional = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  PMAA_PUBLIC_EVENT_FIXTURE: z.enum(["", "0", "1"]).optional(),

  AUTH_SECRET: optional,
  AUTH_MICROSOFT_ENTRA_ID_ID: optional,
  AUTH_MICROSOFT_ENTRA_ID_SECRET: optional,
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: optional,

  GRAPH_TENANT_ID: optional,
  GRAPH_CLIENT_ID: optional,
  GRAPH_CLIENT_SECRET: optional,
  GRAPH_SENDER_MAILBOX: optional,
  GRAPH_ORGANIZER_USER_ID: optional,

  WHATSAPP_PHONE_NUMBER_ID: optional,
  WHATSAPP_ACCESS_TOKEN: optional,
  WHATSAPP_APP_SECRET: optional,

  TURNSTILE_SITE_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,

  /** Local test sign-in for the admin (pick a role, no Microsoft account). Only on localhost; see devSignInEnabled. */
  ADMIN_DEV_SIGN_IN: z.stringbool().optional(),

  /** Sample registrations for the public pages until the registration API lands (T022). Only on localhost; see publicSampleDataEnabled. */
  PUBLIC_SAMPLE_DATA: z.stringbool().optional(),
});

export type Env = z.infer<typeof envSchema>;

const publicEventFixtureEnv = envSchema.pick({ NODE_ENV: true, PMAA_PUBLIC_EVENT_FIXTURE: true });

export function publicEventFixtureEnabled() {
  const result = publicEventFixtureEnv.safeParse(process.env);
  if (!result.success) return false;
  const env = result.data;
  return !env.PMAA_PUBLIC_EVENT_FIXTURE
    ? env.NODE_ENV === "development"
    : env.PMAA_PUBLIC_EVENT_FIXTURE === "1";
}

export class EnvError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid environment: ${problems.join("; ")}`);
    this.name = "EnvError";
  }
}

/** Parses the given variables (process.env by default). Error messages name the variable, never its value. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new EnvError(problems);
  }
  devSignInEnabled(source);
  publicSampleDataEnabled(source);
  return result.data;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalUrl(value: string | undefined): boolean {
  try {
    return value !== undefined && LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

/**
 * Whether the admin test sign-in is on. It lets anyone pick an admin role without a Microsoft account,
 * so it only works when the app runs on this machine: APP_BASE_URL on localhost, or `next dev` with no
 * APP_BASE_URL. Turned on anywhere else (staging, production), it throws, so the app refuses to start.
 */
export function devSignInEnabled(source: Record<string, string | undefined> = process.env): boolean {
  return localOnlyFlag("ADMIN_DEV_SIGN_IN", source);
}

/**
 * Whether the public pages may show sample registrations (PUBLIC_SAMPLE_DATA), until the registration
 * API reads real ones (T022). Same rule as the admin test sign-in: this machine only, or the app refuses to start.
 */
export function publicSampleDataEnabled(source: Record<string, string | undefined> = process.env): boolean {
  return localOnlyFlag("PUBLIC_SAMPLE_DATA", source);
}

/** A developer-only switch: false when off, true on localhost, and throws when switched on anywhere else. */
function localOnlyFlag(name: "ADMIN_DEV_SIGN_IN" | "PUBLIC_SAMPLE_DATA", source: Record<string, string | undefined>): boolean {
  const flag = source[name]?.trim().toLowerCase();
  // Same truthy words as z.stringbool().
  if (!flag || !["true", "1", "yes", "on", "y", "enabled"].includes(flag)) return false;
  const local = source.APP_BASE_URL ? isLocalUrl(source.APP_BASE_URL) : source.NODE_ENV === "development";
  if (!local) {
    throw new EnvError([`${name}: allowed only when APP_BASE_URL is localhost; remove it outside a developer machine`]);
  }
  return true;
}
