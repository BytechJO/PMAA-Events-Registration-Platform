import { describe, expect, it } from "vitest";
import { devSignInEnabled, EnvError, loadEnv } from "./env";

const base = { APP_BASE_URL: "http://localhost:3000", DATABASE_URL: "postgres://x" };

describe("loadEnv", () => {
  it("accepts the required variables and leaves integrations optional", () => {
    const env = loadEnv(base);
    expect(env.NODE_ENV).toBe("development");
    expect(env.GRAPH_CLIENT_ID).toBeUndefined();
  });

  it("treats an empty integration value as not set", () => {
    expect(loadEnv({ ...base, GRAPH_CLIENT_ID: "" }).GRAPH_CLIENT_ID).toBeUndefined();
  });

  it("refuses to start when a required variable is missing, naming it but not leaking values", () => {
    try {
      loadEnv({ APP_BASE_URL: "http://localhost:3000", AUTH_SECRET: "super-secret" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(EnvError);
      expect((e as EnvError).message).toContain("DATABASE_URL");
      expect((e as EnvError).message).not.toContain("super-secret");
    }
  });

  it("rejects a base URL that is not a URL", () => {
    expect(() => loadEnv({ ...base, APP_BASE_URL: "not a url" })).toThrow(EnvError);
  });

  it("refuses to start with the admin test sign-in on a real domain", () => {
    expect(loadEnv({ ...base, ADMIN_DEV_SIGN_IN: "true" }).ADMIN_DEV_SIGN_IN).toBe(true);
    expect(() => loadEnv({ ...base, APP_BASE_URL: "https://staging.example.org", ADMIN_DEV_SIGN_IN: "true" })).toThrow(/ADMIN_DEV_SIGN_IN/);
  });
});

describe("devSignInEnabled (admin test sign-in, local only)", () => {
  it("is off unless switched on", () => {
    expect(devSignInEnabled({ APP_BASE_URL: "http://localhost:3000" })).toBe(false);
    expect(devSignInEnabled({ APP_BASE_URL: "http://localhost:3000", ADMIN_DEV_SIGN_IN: "false" })).toBe(false);
    expect(devSignInEnabled({ APP_BASE_URL: "https://pmaa.example.org", ADMIN_DEV_SIGN_IN: "" })).toBe(false);
  });

  it("works on localhost, and in next dev with no base URL", () => {
    for (const url of ["http://localhost:3100", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
      expect([url, devSignInEnabled({ APP_BASE_URL: url, ADMIN_DEV_SIGN_IN: "true" })]).toEqual([url, true]);
    }
    expect(devSignInEnabled({ NODE_ENV: "development", ADMIN_DEV_SIGN_IN: "1" })).toBe(true);
  });

  it("throws anywhere else, so staging and production refuse to start", () => {
    for (const env of [
      { APP_BASE_URL: "https://staging.pmaa.example.org", ADMIN_DEV_SIGN_IN: "true" },
      { APP_BASE_URL: "https://localhost.evil.example", ADMIN_DEV_SIGN_IN: "true" },
      { NODE_ENV: "production", ADMIN_DEV_SIGN_IN: "true" },
      { APP_BASE_URL: "not a url", ADMIN_DEV_SIGN_IN: "yes" },
    ]) {
      expect(() => devSignInEnabled(env)).toThrow(EnvError);
    }
  });
});
