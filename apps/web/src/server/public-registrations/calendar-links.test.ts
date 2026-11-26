import { describe, expect, it } from "vitest";
import { googleCalendarUrl, outlookCalendarUrl } from "./calendar-links";
import { calendarEventFor } from "./confirmation";
import { sampleConfirmations } from "./samples";

const confirmed = sampleConfirmations["sample-confirmed"]!;
const entry = calendarEventFor(confirmed, "https://events.pmaa.example");

describe("Google Calendar link", () => {
  const url = new URL(googleCalendarUrl(entry, "Asia/Amman"));

  it("opens a new event with the title, UTC times and the session's zone", () => {
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe(confirmed.event.title);
    expect(url.searchParams.get("dates")).toBe("20270314T120000Z/20270314T130000Z");
    expect(url.searchParams.get("ctz")).toBe("Asia/Amman");
    expect(url.searchParams.get("details")).toContain("https://events.pmaa.example/webinars/creating-engaging-digital-content");
  });
});

describe("Outlook link", () => {
  const url = new URL(outlookCalendarUrl(entry));

  it("opens the compose form with ISO times", () => {
    expect(url.origin).toBe("https://outlook.office.com");
    expect(url.searchParams.get("rru")).toBe("addevent");
    expect(url.searchParams.get("subject")).toBe(confirmed.event.title);
    expect(url.searchParams.get("startdt")).toBe("2027-03-14T12:00:00.000Z");
    expect(url.searchParams.get("enddt")).toBe("2027-03-14T13:00:00.000Z");
  });
});

describe("links that leave our site", () => {
  it("carry no personal data and no secure token", () => {
    for (const href of [googleCalendarUrl(entry, "Asia/Amman"), outlookCalendarUrl(entry)]) {
      const decoded = decodeURIComponent(href);
      expect(decoded).not.toContain(confirmed.email);
      expect(decoded).not.toContain("sample-confirmed");
      expect(decoded).not.toContain(confirmed.registrationId);
    }
  });
});
