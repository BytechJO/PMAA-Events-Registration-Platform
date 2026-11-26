import { icsUtc, type CalendarEvent } from "./ics";

/*
 * "Add to calendar" links for Google and Outlook on the web. They carry only what the calendar entry
 * needs (title, times, description, place, event page). Never the teacher's email, never the secure
 * token, never a Teams join link: these URLs leave our site.
 */

type LinkEvent = Omit<CalendarEvent, "uid">;

const q = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

export function googleCalendarUrl(event: LinkEvent, timeZone: string): string {
  const dates = `${icsUtc(event.startsAt)}/${icsUtc(event.endsAt)}`;
  return (
    "https://calendar.google.com/calendar/render?" +
    q({ action: "TEMPLATE", text: event.title, details: `${event.description}\n\n${event.url}`, location: event.location, ctz: timeZone }) +
    `&dates=${dates}`
  );
}

export function outlookCalendarUrl(event: LinkEvent): string {
  return (
    "https://outlook.office.com/calendar/0/deeplink/compose?" +
    q({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: event.title,
      startdt: event.startsAt.toISOString(),
      enddt: event.endsAt.toISOString(),
      body: `${event.description}\n\n${event.url}`,
      location: event.location,
    })
  );
}
