import { describe, expect, it } from "vitest";
import { calendarEventFor } from "./confirmation";
import { buildIcs, escapeText, foldLine, icsUtc } from "./ics";
import { sampleConfirmations } from "./samples";

const confirmed = sampleConfirmations["sample-confirmed"]!;
const now = new Date("2026-11-26T10:00:00Z");
const ics = buildIcs(calendarEventFor(confirmed, "https://events.pmaa.example"), now);
/** The file with folded lines joined again, as a calendar app reads it. */
const unfolded = ics.replace(/\r\n /g, "");
const prop = (name: string) => unfolded.split("\r\n").find((l) => l.startsWith(`${name}:`))?.slice(name.length + 1);

describe("calendar file (.ics)", () => {
  it("is a valid VCALENDAR with CRLF line ends", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(prop("METHOD")).toBe("PUBLISH");
  });

  it("puts the session at the exact instant: 3:00–4:00 PM in Amman is 12:00–13:00 UTC", () => {
    expect(prop("DTSTART")).toBe("20270314T120000Z");
    expect(prop("DTEND")).toBe("20270314T130000Z");
    expect(prop("DTSTAMP")).toBe("20261126T100000Z");
  });

  it("names the session's zone in the description, with the title and the event page", () => {
    expect(prop("SUMMARY")).toBe("Creating Engaging Digital Content on the GROW LMS");
    expect(prop("DESCRIPTION")).toContain("3:00 – 4:00 PM (Amman\\, UTC+3)");
    expect(prop("URL")).toBe("https://events.pmaa.example/webinars/creating-engaging-digital-content");
  });

  it("has a stable UID per registration, so a second import updates the entry", () => {
    expect(prop("UID")).toBe("reg_sample_confirmed@pmaa-events");
    expect(buildIcs(calendarEventFor(confirmed, "https://events.pmaa.example"), new Date())).toContain("UID:reg_sample_confirmed@pmaa-events");
  });

  it("never carries a Teams join link or the teacher's email", () => {
    expect(unfolded).not.toMatch(/teams\.microsoft\.com|https:\/\/teams/i);
    expect(unfolded).not.toContain(confirmed.email);
    expect(prop("LOCATION")).toBe("Microsoft Teams (join link in your confirmation email)");
  });

  it("keeps every physical line within 75 octets", () => {
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("ics helpers", () => {
  it("formats UTC instants", () => {
    expect(icsUtc(new Date("2027-03-14T12:00:00.000Z"))).toBe("20270314T120000Z");
  });

  it("escapes backslash, semicolon, comma and line breaks", () => {
    expect(escapeText("a\\b; c, d\ne")).toBe("a\\\\b\\; c\\, d\\ne");
  });

  it("folds long lines without splitting a multi-byte character", () => {
    const line = "DESCRIPTION:" + "é".repeat(80);
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded).not.toContain("�");
  });

  it("leaves short lines alone", () => {
    expect(foldLine("SUMMARY:Short")).toBe("SUMMARY:Short");
  });
});
