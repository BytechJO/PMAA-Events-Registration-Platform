import { publicEventFixtureEnabled } from "@pmaa/core";

type EventStatus = "published" | "draft" | "archived";
type Availability = "open" | "full" | "closed";

type Session = {
  id: string;
  status: "published" | "draft" | "cancelled";
  startsAt: string;
  endsAt: string;
  timeZone: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  seatsRemaining: number;
};

type Event = {
  slug: string;
  status: EventStatus;
  title: string;
  intro: string;
  learningOutcomes: string[];
  certificateNote: string;
  liveQANote: string;
  recordingNote: string;
  sessions: Session[];
};

function availability(session: Session, now: number): Availability {
  if (
    now < Date.parse(session.registrationOpensAt) ||
    now >= Date.parse(session.registrationClosesAt) ||
    now >= Date.parse(session.startsAt)
  ) return "closed";

  return session.seatsRemaining > 0 ? "open" : "full";
}

/** Keep this allowlist at the public boundary when T014 replaces the fixture. */
export function toPublicEvent(event: Event, now: number) {
  if (event.status !== "published") return null;

  return {
    slug: event.slug,
    title: event.title,
    intro: event.intro,
    learningOutcomes: event.learningOutcomes,
    certificateNote: event.certificateNote,
    liveQANote: event.liveQANote,
    recordingNote: event.recordingNote,
    sessions: event.sessions
      .filter((session) => session.status === "published")
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
      .map((session) => ({
        id: session.id,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        timeZone: session.timeZone,
        availability: availability(session, now),
      })),
  };
}

export type PublicEvent = NonNullable<ReturnType<typeof toPublicEvent>>;

const demoSlug = "creating-engaging-digital-content";
const day = 24 * 60 * 60 * 1000;

/** Temporary source for T020. Dates roll forward so the demo stays usable. */
export function getPublicEvent(slug: string, now = Date.now()) {
  if (!publicEventFixtureEnabled()) return null;
  if (slug !== demoSlug && slug !== "draft-webinar") return null;

  const date = (days: number, hour = 0) =>
    new Date(Math.floor(now / day) * day + days * day + hour * 3600000).toISOString();

  const sessions: Session[] = ([
    { id: "demo-open", days: 7, seats: 12, closes: 6, status: "published" },
    { id: "demo-full", days: 13, seats: 0, closes: 12, status: "published" },
    { id: "demo-closed", days: 17, seats: 12, closes: -1, status: "published" },
    { id: "demo-draft", days: 21, seats: 12, closes: 20, status: "draft" },
  ] as const).map(({ id, days, seats, closes, status }) => ({
    id,
    status,
    startsAt: date(days, 12),
    endsAt: date(days, 13),
    timeZone: "Asia/Amman",
    registrationOpensAt: date(-7),
    registrationClosesAt: date(closes),
    seatsRemaining: seats,
  }));

  return toPublicEvent({
    slug,
    status: slug === demoSlug ? "published" : "draft",
    title: "Creating Engaging Digital Content on the GROW LMS",
    intro: "Join our live webinars designed to support, empower, and inspire teachers every day.",
    learningOutcomes: [
      "Explore the Teacher Dashboard and its key features.",
      "Learn how to use class codes, chats, and news updates.",
      "Customize the course dashboard.",
      "Create interactive learning activities and games.",
    ],
    certificateNote: "All participants will receive a Certificate of Attendance.",
    liveQANote: "Ask questions during the live session.",
    recordingNote: "Registered teachers receive the recording after the session.",
    sessions,
  }, now);
}
