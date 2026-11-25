import type { AdminSession } from "@pmaa/core";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let current: AdminSession | null = null;
vi.mock("./session", () => ({ getAdminSession: async () => current }));

const { AdminSection, devChoices, shellUser } = await import("./admin-access");

async function section(navKey: Parameters<typeof AdminSection>[0]["navKey"]) {
  return renderToStaticMarkup(await AdminSection({ navKey, children: <p>secret list</p> }));
}

describe("AdminSection: the server checks the role, not only the menu (rule 1)", () => {
  beforeEach(() => {
    current = null;
  });

  it("renders the section for a role that may see it", async () => {
    current = { userId: "u", grants: [{ role: "read_only" }] };
    expect(await section("events")).toContain("secret list");
  });

  it("shows 'not allowed' and never the content for a role that may not", async () => {
    current = { userId: "u", grants: [{ role: "read_only" }] };
    const html = await section("settings");
    expect(html).toContain("You don&#x27;t have access to this page");
    expect(html).not.toContain("secret list");
  });

  it("shows 'not allowed' without a session or without a role", async () => {
    expect(await section("events")).not.toContain("secret list");
    current = { userId: "u", grants: [] };
    expect(await section("events")).not.toContain("secret list");
  });
});

describe("shellUser", () => {
  it("shows the name, the highest role and initials", () => {
    expect(shellUser({ userId: "u", displayName: "Test Event Admin", grants: [{ role: "read_only" }, { role: "event_admin" }] })).toEqual({
      name: "Test Event Admin",
      roleLabel: "Event Admin",
      initials: "TE",
    });
    expect(shellUser({ userId: "u", grants: [] })).toEqual({ name: "Admin", roleLabel: "No role", initials: "A" });
  });
});

describe("devChoices", () => {
  it("lists every role plus 'no role' when the test sign-in is on, and nothing when off", () => {
    vi.stubEnv("ADMIN_DEV_SIGN_IN", "true");
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000");
    expect(devChoices()?.map((c) => c.value)).toEqual(["super_admin", "event_admin", "attendance_manager", "read_only", "none"]);
    vi.stubEnv("ADMIN_DEV_SIGN_IN", "");
    expect(devChoices()).toBeNull();
    vi.unstubAllEnvs();
  });
});
