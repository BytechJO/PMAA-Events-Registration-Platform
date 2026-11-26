import { publicSampleDataEnabled } from "@pmaa/core";
import { formatSessionWhen, formatTimeRange, formatZone } from "./format";
import type { CalendarEvent } from "./ics";
import { sampleConfirmations } from "./samples";

/*
 * What the "You're registered" page and the calendar file need about one registration, found by the
 * secure token from the registration response (spec §13: /api/public/registrations/{secureToken}).
 * The registration API (T022) supplies the real lookup by token hash; until then only sample
 * registrations exist, and only on a developer machine (PUBLIC_SAMPLE_DATA).
 */

/** Online registration states (spec §11.2). */
export type OnlineRegistrationStatus = "submitted" | "confirmed" | "waitlisted" | "cancelled";

export interface RegistrationConfirmation {
  registrationId: string;
  status: OnlineRegistrationStatus;
  /** The teacher's own address, shown only to the holder of the secure token. */
  email: string;
  event: { slug: string; title: string };
  session: { startsAt: Date; endsAt: Date; timeZone: string };
  /** Reminder emails before the start, in minutes (a setting, T071; today 24 h and 1 h). */
  reminderOffsetsMinutes: number[];
  recordingPromised: boolean;
  certificateOffered: boolean;
}

export interface ConfirmationSource {
  findByToken(token: string): Promise<RegistrationConfirmation | null>;
}

/** Secure tokens are URL-safe random strings. Anything else is refused before a lookup. */
export function isWellFormedToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(token);
}

export const sampleSource: ConfirmationSource = {
  async findByToken(token) {
    return sampleConfirmations[token] ?? null;
  },
};

/** Finds nothing: the state on staging and production until T022 lands. */
export const emptySource: ConfirmationSource = {
  async findByToken() {
    return null;
  },
};

export function getConfirmationSource(): ConfirmationSource {
  return publicSampleDataEnabled() ? sampleSource : emptySource;
}

/** The registration for this token, or null when the token is malformed, unknown or for another event. */
export async function findConfirmation(
  token: unknown,
  slug?: string,
  source: ConfirmationSource = getConfirmationSource(),
): Promise<RegistrationConfirmation | null> {
  if (!isWellFormedToken(token)) return null;
  const found = await source.findByToken(token);
  if (!found || (slug !== undefined && found.event.slug !== slug)) return null;
  return found;
}

/** Only a confirmed (or just submitted) place goes into a calendar; waitlisted and cancelled do not. */
export function canAddToCalendar(c: RegistrationConfirmation): boolean {
  return c.status === "confirmed" || c.status === "submitted";
}

/** The site's public address, for absolute links in calendar entries. */
export function publicBaseUrl(source: Record<string, string | undefined> = process.env): string {
  try {
    return new URL(source.APP_BASE_URL ?? "").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function eventPagePath(slug: string): string {
  return `/webinars/${encodeURIComponent(slug)}`;
}

export function calendarFilePath(token: string): string {
  return `/api/public/registrations/${encodeURIComponent(token)}/calendar.ics`;
}

/** One calendar entry, shared by the .ics file and the Google and Outlook links. */
export function calendarEventFor(c: RegistrationConfirmation, baseUrl: string): CalendarEvent {
  const { startsAt, endsAt, timeZone } = c.session;
  const url = `${baseUrl}${eventPagePath(c.event.slug)}`;
  return {
    uid: `${c.registrationId}@pmaa-events`,
    title: c.event.title,
    description: [
      `Live webinar on Microsoft Teams, ${formatTimeRange(startsAt, endsAt, timeZone)} (${formatZone(startsAt, timeZone)}).`,
      "Your personal join link is in the confirmation email from PMAA Education Group.",
    ].join("\n"),
    location: "Microsoft Teams (join link in your confirmation email)",
    url,
    startsAt,
    endsAt,
  };
}

/** "Sunday 14 March 2027, 3:00 – 4:00 PM (Amman, UTC+3)" */
export function sessionWhen(c: RegistrationConfirmation): string {
  return formatSessionWhen(c.session.startsAt, c.session.endsAt, c.session.timeZone);
}
