import { AlarmClock, CalendarPlus, GraduationCap, Hourglass, type LucideIcon, Mail, Video } from "lucide-react";
import { publicSite } from "@/config/public-site";
import { googleCalendarUrl, outlookCalendarUrl } from "@/server/public-registrations/calendar-links";
import {
  calendarEventFor,
  calendarFilePath,
  canAddToCalendar,
  eventPagePath,
  sessionWhen,
  type RegistrationConfirmation,
} from "@/server/public-registrations/confirmation";
import { formatOffset } from "@/server/public-registrations/format";

/*
 * "You're registered" page (doc 08 core-04, T023). It says what we *will* do: the email is being
 * sent, never "sent" (spec §6.3). No Teams join link here: it arrives by email only.
 */

function NextStep({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-10 flex-none items-center justify-center rounded-full bg-linear-to-br from-brand-2 to-pink text-white">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <p className="self-center text-[15px] leading-relaxed text-foreground">{children}</p>
    </li>
  );
}

/** "24 hours and 1 hour", each in bold. */
function ReminderTimes({ offsets }: { offsets: number[] }) {
  const sorted = [...offsets].sort((a, b) => b - a);
  return (
    <>
      {sorted.map((m, i) => (
        <span key={m}>
          {i > 0 && (i === sorted.length - 1 ? " and " : ", ")}
          <b>{formatOffset(m)}</b>
        </span>
      ))}
    </>
  );
}

function CalendarButton({ href, color, label, download }: { href: string; color: string; label: string; download?: boolean }) {
  return (
    <a
      href={href}
      {...(download ? { download: "" } : { target: "_blank", rel: "noreferrer noopener" })}
      className="inline-flex h-12 w-full items-center gap-3 rounded-lg border border-border bg-white px-4 text-[15px] font-semibold text-foreground shadow-xs transition-colors hover:border-brand-2 hover:bg-lavender focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-auto"
    >
      <span className="size-[18px] flex-none rounded-[4px]" style={{ background: color }} aria-hidden="true" />
      {label}
    </a>
  );
}

function Heading({ emoji, title, when, eventTitle }: { emoji: string; title: string; when: string; eventTitle: string }) {
  return (
    <div className="text-center">
      <div className="text-[44px] leading-none" aria-hidden="true">
        {emoji}
      </div>
      <h1 className="mt-3 font-display text-[34px] leading-tight font-bold text-brand sm:text-[44px]">{title}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground sm:text-base">
        {eventTitle} · <b className="font-semibold text-foreground">{when}</b>
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-9">{children}</div>;
}

function SupportLine() {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Need to change something? Reply to the confirmation email or write to{" "}
      <a className="font-medium text-brand-2 underline-offset-2 hover:underline" href={`mailto:${publicSite.supportEmail}`}>
        {publicSite.supportEmail}
      </a>
      .
    </p>
  );
}

function Registered({ c, token, baseUrl }: { c: RegistrationConfirmation; token: string; baseUrl: string }) {
  const entry = calendarEventFor(c, baseUrl);
  return (
    <>
      <Heading emoji="🎉" title="You're registered!" eventTitle={c.event.title} when={sessionWhen(c)} />
      <Card>
        <h2 className="text-xl font-bold">What happens next</h2>
        <ul className="mt-4 flex flex-col gap-4">
          <NextStep icon={Mail}>
            We are sending a confirmation email to <b className="wrap-anywhere">{c.email}</b> with your Microsoft Teams join link. It can take a few
            minutes. Please check your spam or junk folder too.
          </NextStep>
          {c.reminderOffsetsMinutes.length > 0 && (
            <NextStep icon={AlarmClock}>
              We will remind you by email <ReminderTimes offsets={c.reminderOffsetsMinutes} /> before the session starts.
            </NextStep>
          )}
          {c.recordingPromised && (
            <NextStep icon={Video}>
              <b>Can&apos;t attend live?</b> No problem. Registered teachers receive the recording after the webinar.
            </NextStep>
          )}
          {c.certificateOffered && (
            <NextStep icon={GraduationCap}>
              <b>Certificate of Attendance.</b> Participants who attend receive their certificate by email after the webinar.
            </NextStep>
          )}
        </ul>
        <section aria-labelledby="add-to-calendar" className="mt-7 border-t border-border pt-6">
          <h2 id="add-to-calendar" className="flex items-center gap-2 text-xl font-bold">
            <CalendarPlus className="size-5 text-brand-2" aria-hidden="true" />
            Add to your calendar
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CalendarButton href={googleCalendarUrl(entry, c.session.timeZone)} color="#4285f4" label="Google Calendar" />
            <CalendarButton href={outlookCalendarUrl(entry)} color="#0078d4" label="Outlook" />
            <CalendarButton href={calendarFilePath(token)} color="#333333" label="Apple / .ics file" download />
          </div>
        </section>
      </Card>
      <SupportLine />
    </>
  );
}

function Waitlisted({ c }: { c: RegistrationConfirmation }) {
  return (
    <>
      <Heading emoji="⏳" title="You're on the waiting list" eventTitle={c.event.title} when={sessionWhen(c)} />
      <Card>
        <h2 className="text-xl font-bold">What happens next</h2>
        <ul className="mt-4 flex flex-col gap-4">
          <NextStep icon={Mail}>
            We are sending an email to <b className="wrap-anywhere">{c.email}</b> to say you are on the waiting list. Please check your spam or junk
            folder too.
          </NextStep>
          <NextStep icon={Hourglass}>
            This session is full right now. If a place becomes free, we will email you your confirmation and your Microsoft Teams join link.
          </NextStep>
        </ul>
      </Card>
      <SupportLine />
    </>
  );
}

function BackToEvent({ slug }: { slug: string }) {
  return (
    <a
      href={eventPagePath(slug)}
      className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      Back to the webinar page
    </a>
  );
}

function Cancelled({ c }: { c: RegistrationConfirmation }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-[34px] leading-tight font-bold text-brand sm:text-[40px]">This registration is cancelled</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Your place for {c.event.title} on <b className="font-semibold text-foreground">{sessionWhen(c)}</b> is cancelled. You can register again on
        the webinar page while places are open.
      </p>
      <BackToEvent slug={c.event.slug} />
    </div>
  );
}

/** Unknown, malformed or other-event token. Same message for all, so it never says which tokens exist. */
export function RegistrationNotFound({ slug }: { slug: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-[34px] leading-tight font-bold text-brand sm:text-[40px]">We couldn&apos;t find this registration</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        The link may be incomplete or out of date. Please use the link in your confirmation email, or register on the webinar page.
      </p>
      <BackToEvent slug={slug} />
    </div>
  );
}

export function RegisteredView({ confirmation: c, token, baseUrl }: { confirmation: RegistrationConfirmation; token: string; baseUrl: string }) {
  if (c.status === "waitlisted") return <Waitlisted c={c} />;
  if (c.status === "cancelled") return <Cancelled c={c} />;
  if (canAddToCalendar(c)) return <Registered c={c} token={token} baseUrl={baseUrl} />;
  return null;
}
