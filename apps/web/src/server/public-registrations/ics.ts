/*
 * iCalendar file for "Add to calendar" (RFC 5545), for Outlook, Google and Apple calendars.
 *
 * Start and end are written as UTC instants (…Z). Every calendar app converts those to the reader's
 * own zone, so the session lands at the right moment without hand-written VTIMEZONE rules; the
 * description still names the session's zone. The Teams join link is never in this file: it
 * arrives in the confirmation email only.
 */

export interface CalendarEvent {
  /** Stable per registration, so importing the file twice updates the entry instead of adding a second one. */
  uid: string;
  title: string;
  description: string;
  location: string;
  url: string;
  startsAt: Date;
  endsAt: Date;
}

/** 20270314T120000Z */
export function icsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes a TEXT value: backslash, semicolon, comma and line breaks. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/** Folds a content line at 75 octets; continuation lines start with one space. Never splits a character. */
export function foldLine(line: string): string {
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74; // the leading space of a continuation line counts
    if (size + bytes > limit) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PMAA Education Group//Events Registration Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(event.uid)}`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsUtc(event.startsAt)}`,
    `DTEND:${icsUtc(event.endsAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `URL:${event.url}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
