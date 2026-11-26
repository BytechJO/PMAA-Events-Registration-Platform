import { describe, expect, it } from "vitest";
import { formatOffset, formatSessionWhen, formatTimeRange, formatZone, sessionDateKey } from "./format";

describe("session times in the session's own zone", () => {
  it("Amman (UTC+3 all year), as on the core-04 mockup", () => {
    expect(formatSessionWhen(new Date("2027-03-14T12:00:00Z"), new Date("2027-03-14T13:00:00Z"), "Asia/Amman")).toBe(
      "Sunday 14 March 2027, 3:00 – 4:00 PM (Amman, UTC+3)",
    );
  });

  it("follows summer time: London is UTC+0 in March and UTC+1 in July", () => {
    expect(formatZone(new Date("2027-03-14T12:00:00Z"), "Europe/London")).toBe("London, UTC+0");
    expect(formatZone(new Date("2027-07-14T12:00:00Z"), "Europe/London")).toBe("London, UTC+1");
  });

  it("names a city with spaces and half-hour offsets", () => {
    expect(formatZone(new Date("2027-03-14T12:00:00Z"), "America/New_York")).toBe("New York, UTC-4");
    expect(formatZone(new Date("2027-03-14T12:00:00Z"), "Asia/Kolkata")).toBe("Kolkata, UTC+5:30");
  });

  it("shows AM and PM on both ends only when they differ", () => {
    expect(formatTimeRange(new Date("2027-03-14T08:30:00Z"), new Date("2027-03-14T09:30:00Z"), "Asia/Amman")).toBe("11:30 AM – 12:30 PM");
  });

  it("uses the session's date, not the server's, near midnight", () => {
    // 22:30 UTC on the 13th is already the 14th in Amman.
    expect(sessionDateKey(new Date("2027-03-13T22:30:00Z"), "Asia/Amman")).toBe("2027-03-14");
  });
});

describe("reminder offsets in words", () => {
  it.each([
    [1440, "24 hours"],
    [60, "1 hour"],
    [30, "30 minutes"],
    [1, "1 minute"],
  ])("%i minutes → %s", (minutes, words) => {
    expect(formatOffset(minutes)).toBe(words);
  });
});
