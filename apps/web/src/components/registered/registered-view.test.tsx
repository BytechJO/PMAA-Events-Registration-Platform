import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { sampleConfirmations } from "@/server/public-registrations/samples";
import type { RegistrationConfirmation } from "@/server/public-registrations/confirmation";
import { RegisteredView, RegistrationNotFound } from "./RegisteredView";

const confirmed = sampleConfirmations["sample-confirmed"]!;
const render = (c: RegistrationConfirmation, token = "sample-confirmed") =>
  renderToStaticMarkup(<RegisteredView confirmation={c} token={token} baseUrl="https://events.pmaa.example" />);
/** Visible text, tags removed and entities decoded enough for the checks below. */
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

describe("You're registered (core-04)", () => {
  const html = render(confirmed);

  it("shows the heading, the event and the session time in its own zone", () => {
    expect(text(html)).toContain("You're registered!");
    expect(text(html)).toContain("Creating Engaging Digital Content on the GROW LMS · Sunday 14 March 2027, 3:00 – 4:00 PM (Amman, UTC+3)");
  });

  it("says the email is being sent, never that it was sent or delivered", () => {
    expect(text(html)).toContain(`We are sending a confirmation email to ${confirmed.email}`);
    expect(text(html)).toContain("check your spam or junk folder");
    expect(text(html)).not.toMatch(/\b(we|has been|was|have) (sent|delivered)\b/i);
  });

  it("lists the reminder times from the data, largest first", () => {
    expect(text(html)).toContain("We will remind you by email 24 hours and 1 hour before the session starts.");
    const three = text(render({ ...confirmed, reminderOffsetsMinutes: [60, 2880, 1440] }));
    expect(three).toContain("48 hours , 24 hours and 1 hour");
    expect(text(render({ ...confirmed, reminderOffsetsMinutes: [] }))).not.toContain("remind you");
  });

  it("shows the recording and certificate notes only when the event offers them", () => {
    expect(text(html)).toContain("Can't attend live?");
    expect(text(html)).toContain("Certificate of Attendance.");
    const bare = text(render({ ...confirmed, recordingPromised: false, certificateOffered: false }));
    expect(bare).not.toContain("Can't attend live?");
    expect(bare).not.toContain("Certificate of Attendance");
  });

  it("offers Google, Outlook and the .ics file", () => {
    expect(html).toContain('href="https://calendar.google.com/calendar/render?');
    expect(html).toContain('href="https://outlook.office.com/calendar/0/deeplink/compose?');
    expect(html).toMatch(/href="\/api\/public\/registrations\/sample-confirmed\/calendar\.ics" download=""/);
    expect(html.match(/rel="noreferrer noopener"/g)).toHaveLength(2);
  });

  it("never puts a Teams join link on the page", () => {
    expect(html).not.toMatch(/teams\.microsoft\.com|https:\/\/teams/i);
  });
});

describe("other states", () => {
  it("waitlisted: says so, and offers no calendar entry", () => {
    const html = render(sampleConfirmations["sample-waitlisted"]!, "sample-waitlisted");
    expect(text(html)).toContain("You're on the waiting list");
    expect(text(html)).toContain("We are sending an email to");
    expect(html).not.toContain("calendar.ics");
    expect(text(html)).not.toContain("Add to your calendar");
  });

  it("cancelled: says so, links back to the event page, and shows no email address", () => {
    const html = render(sampleConfirmations["sample-cancelled"]!, "sample-cancelled");
    expect(text(html)).toContain("This registration is cancelled");
    expect(html).toContain('href="/webinars/creating-engaging-digital-content"');
    expect(html).not.toContain(confirmed.email);
    expect(html).not.toContain("calendar.ics");
  });

  it("not found: one message for every unknown token", () => {
    const html = renderToStaticMarkup(<RegistrationNotFound slug="creating-engaging-digital-content" />);
    expect(text(html)).toContain("We couldn't find this registration");
    expect(html).toContain('href="/webinars/creating-engaging-digital-content"');
  });
});
