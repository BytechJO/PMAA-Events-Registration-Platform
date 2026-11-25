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
});

export type Env = z.infer<typeof envSchema>;

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
  return result.data;
}
