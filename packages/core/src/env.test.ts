import { describe, expect, it } from "vitest";
import { EnvError, loadEnv } from "./env";

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
});
