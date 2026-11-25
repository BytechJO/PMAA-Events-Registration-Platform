import { describe, expect, it } from "vitest";
import { devSessionFor } from "./dev-session";
import { devSignInHandler, devSignOutHandler } from "./dev-sign-in";

const local = () => ({ APP_BASE_URL: "http://localhost:3000", ADMIN_DEV_SIGN_IN: "true" });
const off = () => ({ APP_BASE_URL: "http://localhost:3000" });
const staging = () => ({ APP_BASE_URL: "https://staging.pmaa.example.org", ADMIN_DEV_SIGN_IN: "true" });

function post(role?: string) {
  const body = new FormData();
  if (role !== undefined) body.set("role", role);
  return new Request("http://localhost:3000/api/dev/sign-in", { method: "POST", body });
}

describe("admin test sign-in", () => {
  it("signs in with the chosen role and opens Events", async () => {
    const res = await devSignInHandler(local)(post("event_admin"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin/events");
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toMatch(/^pmaa_dev_role=event_admin;/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("rejects an unknown role", async () => {
    expect((await devSignInHandler(local)(post("owner"))).status).toBe(400);
    expect((await devSignInHandler(local)(post())).status).toBe(400);
  });

  it("does not exist when switched off", async () => {
    expect((await devSignInHandler(off)(post("super_admin"))).status).toBe(404);
    expect((await devSignOutHandler(off)(post())).status).toBe(404);
  });

  it("refuses outside localhost, even if switched on", async () => {
    await expect(devSignInHandler(staging)(post("super_admin"))).rejects.toThrow(/ADMIN_DEV_SIGN_IN/);
  });

  it("signs out by clearing the cookie", async () => {
    const res = await devSignOutHandler(local)(post());
    expect(res.status).toBe(303);
    expect(res.headers.get("set-cookie")).toMatch(/^pmaa_dev_role=;.*Max-Age=0/);
  });
});

describe("devSessionFor", () => {
  it("builds a session for each role", () => {
    expect(devSessionFor("super_admin")).toEqual({ userId: "dev-super_admin", displayName: "Test Super Admin", grants: [{ role: "super_admin" }] });
    expect(devSessionFor("read_only")?.grants).toEqual([{ role: "read_only" }]);
  });

  it("signs in a user with no role for the 'not allowed' page", () => {
    expect(devSessionFor("none")).toEqual({ userId: "dev-none", displayName: "Test user", grants: [] });
  });

  it("ignores missing or forged values", () => {
    for (const v of [undefined, "", "admin", "super_admin; Path=/", "SUPER_ADMIN"]) expect([v, devSessionFor(v)]).toEqual([v, null]);
  });
});
