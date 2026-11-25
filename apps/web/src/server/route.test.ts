import { ConflictError, type AdminSession } from "@pmaa/core";
import { describe, expect, it } from "vitest";
import { adminRoute } from "./route";

const as = (session: AdminSession | null) => async () => session;
const req = () => new Request("http://localhost/api/admin/events/evt_1", { method: "POST" });
const ctx = (eventId = "evt_1") => ({ params: Promise.resolve({ eventId }) });

describe("adminRoute", () => {
  const ok = async () => Response.json({ ok: true });

  it("answers 401 without a session and never runs the handler", async () => {
    let ran = false;
    const route = adminRoute(["event_admin"], async () => ((ran = true), Response.json({})), as(null));
    const res = await route(req(), ctx());
    expect(res.status).toBe(401);
    expect(ran).toBe(false);
  });

  it("answers 403 for a role that is not allowed (AT-11)", async () => {
    const route = adminRoute(["event_admin"], ok, as({ userId: "u", grants: [{ role: "read_only" }] }));
    expect((await route(req(), ctx())).status).toBe(403);
  });

  it("checks event-scoped roles against the event in the URL", async () => {
    const route = adminRoute(["event_admin"], ok, as({ userId: "u", grants: [{ role: "event_admin", eventId: "evt_1" }] }));
    expect((await route(req(), ctx("evt_1"))).status).toBe(200);
    expect((await route(req(), ctx("evt_2"))).status).toBe(403);
  });

  it("turns known errors into their status with a correlation id", async () => {
    const route = adminRoute(["event_admin"], async () => {
      throw new ConflictError("Already registered");
    }, as({ userId: "u", grants: [{ role: "super_admin" }] }));
    const res = await route(req(), ctx());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({ error: "conflict", message: "Already registered" });
    expect(body.correlationId).toBeTruthy();
    expect(res.headers.get("x-correlation-id")).toBe(body.correlationId);
  });

  it("hides unexpected errors behind a 500 with no details", async () => {
    const route = adminRoute(["event_admin"], async () => {
      throw new Error("connection string postgres://user:secret@db");
    }, as({ userId: "u", grants: [{ role: "super_admin" }] }));
    const res = await route(req(), ctx());
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("secret");
  });
});
