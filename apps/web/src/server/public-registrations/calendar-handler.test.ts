import { describe, expect, it } from "vitest";
import { calendarIcsResponse } from "./calendar-handler";
import { sampleSource } from "./confirmation";

const req = () => new Request("http://localhost/api/public/registrations/x/calendar.ics");

describe("GET /api/public/registrations/{secureToken}/calendar.ics", () => {
  it("returns the calendar file for a confirmed registration", async () => {
    const res = await calendarIcsResponse(req(), "sample-confirmed", sampleSource, new Date("2026-11-26T10:00:00Z"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="webinar-2027-03-14.ics"');
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    const body = await res.text();
    expect(body).toContain("DTSTART:20270314T120000Z");
    expect(body).toContain("SUMMARY:Creating Engaging Digital Content on the GROW LMS");
  });

  it.each(["unknown-token-1234", "sample-waitlisted", "sample-cancelled", "bad!"])(
    "answers the same safe 404 for %s, with no personal data",
    async (token) => {
      const res = await calendarIcsResponse(req(), token, sampleSource);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "not_found", message: "Not found", correlationId: expect.any(String) });
      expect(JSON.stringify(body)).not.toContain("@");
    },
  );

  it("keeps the caller's correlation id", async () => {
    const res = await calendarIcsResponse(new Request("http://localhost/x", { headers: { "x-correlation-id": "corr-42" } }), "nope-nope-nope-nope", sampleSource);
    expect(res.headers.get("x-correlation-id")).toBe("corr-42");
  });
});
