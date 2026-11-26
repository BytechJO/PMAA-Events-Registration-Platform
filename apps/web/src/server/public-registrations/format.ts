/*
 * Session times for teachers, always in the session's own time zone (review rule 6: stored in UTC,
 * shown in the session's zone). Example: "Sunday 14 March 2027, 3:00 – 4:00 PM (Amman, UTC+3)".
 */

function parts(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions, locale = "en-GB") {
  const out: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const p of new Intl.DateTimeFormat(locale, { timeZone, ...options }).formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** "Sunday 14 March 2027" in the session's zone. */
export function formatSessionDate(date: Date, timeZone: string): string {
  const p = parts(date, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

function clock(date: Date, timeZone: string) {
  const p = parts(date, timeZone, { hour: "numeric", minute: "2-digit", hour12: true }, "en-US");
  return { time: `${p.hour}:${p.minute}`, period: (p.dayPeriod ?? "").toUpperCase() };
}

/** "3:00 – 4:00 PM", or "11:30 AM – 12:30 PM" when the period changes. */
export function formatTimeRange(startsAt: Date, endsAt: Date, timeZone: string): string {
  const s = clock(startsAt, timeZone);
  const e = clock(endsAt, timeZone);
  return s.period === e.period ? `${s.time} – ${e.time} ${e.period}` : `${s.time} ${s.period} – ${e.time} ${e.period}`;
}

/** "Amman, UTC+3": the city from the IANA name and the offset at that moment (so summer time is right). */
export function formatZone(date: Date, timeZone: string): string {
  const city = (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
  const offset = parts(date, timeZone, { timeZoneName: "shortOffset" }, "en-US").timeZoneName ?? "GMT";
  return `${city}, ${offset.replace(/^GMT/, "UTC").replace(/^UTC$/, "UTC+0")}`;
}

/** The full line shown under the heading. */
export function formatSessionWhen(startsAt: Date, endsAt: Date, timeZone: string): string {
  return `${formatSessionDate(startsAt, timeZone)}, ${formatTimeRange(startsAt, endsAt, timeZone)} (${formatZone(startsAt, timeZone)})`;
}

/** "2027-03-14": the session's date in its own zone, for file names. */
export function sessionDateKey(date: Date, timeZone: string): string {
  const p = parts(date, timeZone, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${p.year}-${p.month}-${p.day}`;
}

/** A reminder offset in words: 1440 → "24 hours", 60 → "1 hour", 30 → "30 minutes". */
export function formatOffset(minutes: number): string {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} ${h === 1 ? "hour" : "hours"}`;
  }
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}
