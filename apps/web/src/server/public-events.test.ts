import { describe, expect, it } from "vitest";
import { toPublicEvent } from "./public-events";

const session = {
  id: "session-1",
  status: "published" as const,
  startsAt: "2027-03-14T12:00:00Z",
  endsAt: "2027-03-14T13:00:00Z",
  timeZone: "Asia/Amman",
  registrationOpensAt: "2027-03-01T00:00:00Z",
  registrationClosesAt: "2027-03-14T00:00:00Z",
  seatsRemaining: 1,
  joinUrl: "https://example.test/private-meeting",
};
const event = {
  slug: "test-webinar",
  status: "published" as const,
  title: "Teacher webinar",
  intro: "A webinar for teachers.",
  learningOutcomes: [],
  certificateNote: "",
  liveQANote: "",
  recordingNote: "",
  sessions: [session],
  privateEmail: "organizer@example.test",
};

describe("FR-002 public event", () => {
  it.each(["draft", "archived"] as const)("hides %s events", (status) => {
    expect(toPublicEvent({ ...event, status }, Date.now())).toBeNull();
  });

  it("returns only public fields and published sessions", () => {
    const sessions = [session, { ...session, id: "draft", status: "draft" as const }];
    const result = toPublicEvent({ ...event, sessions }, Date.parse(session.registrationOpensAt));
    expect(result?.sessions).toEqual([{
      id: session.id,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      timeZone: session.timeZone,
      availability: "open",
    }]);
    expect(result).not.toHaveProperty("privateEmail");
  });

  it.each([
    ["2027-02-28T23:59:59Z", 1, "closed"],
    ["2027-03-01T00:00:00Z", 1, "open"],
    ["2027-03-13T23:59:59Z", 0, "full"],
    ["2027-03-14T00:00:00Z", 1, "closed"],
  ] as const)("shows %s with %d seats as %s", (now, seatsRemaining, expected) => {
    const result = toPublicEvent({ ...event, sessions: [{ ...session, seatsRemaining }] }, Date.parse(now));
    expect(result?.sessions[0]?.availability).toBe(expected);
  });
});
