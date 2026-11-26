import type { PublicEvent } from "@/server/public-events";

const labels = {
  open: "Places available",
  full: "Session full",
  closed: "Registration closed",
};

const sessionThemes = [
  {
    accent: "text-[#542690]",
    triangle: "from-[#7c43bd] to-[#542690]",
    triangleShadow: "bg-[#3f176f]",
    hover: "hover:bg-[#7945bb0d]",
  },
  {
    accent: "text-[#d52c8a]",
    triangle: "from-[#e33f9a] to-[#bd247f]",
    triangleShadow: "bg-[#91165d]",
    hover: "hover:bg-[#d52c8a0d]",
  },
] as const;

function CalendarIcon() {
  return (
    <svg
      className="h-auto w-[clamp(1.5rem,5.7vw,4.8rem)] shrink-0"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <rect x="7" y="11" width="50" height="46" rx="5" />
      <path d="M7 24h50M19 6v11M45 6v11" />
      <path d="M18 34h5m8 0h5m8 0h5M18 44h5m8 0h5m8 0h5" strokeWidth="4.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-auto w-[clamp(1rem,3.55vw,2rem)] shrink-0"
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="14" />
      <path d="M18 9v9l7 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SessionCard({
  session,
  slug,
  number,
  index,
}: {
  session: PublicEvent["sessions"][number];
  slug: string;
  number: number;
  index: number;
}) {
  const theme = sessionThemes[index % sessionThemes.length];
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const { timeZone, availability } = session;
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "full",
  }).format(start);
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).formatToParts(start);
  const month = dateParts.find(({ type }) => type === "month")?.value;
  const day = dateParts.find(({ type }) => type === "day")?.value;
  const weekday = dateParts.find(({ type }) => type === "weekday")?.value;
  const hours = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(start)
    .find(({ type }) => type === "timeZoneName")?.value;

  return (
    <li
      className={`relative min-w-0 px-[clamp(.35rem,2.5vw,1.875rem)] ${
        index > 0 ? "border-l border-[#d9bde9]" : ""
      } ${theme.accent}`}
    >
      <div className="flex items-center justify-center gap-[clamp(.22rem,1.35vw,1rem)]">
        <span
          className="relative aspect-square w-[clamp(1.5rem,5.6vw,4.9rem)] shrink-0"
          aria-hidden="true"
        >
          <span
            className={`absolute inset-0 translate-y-[9%] [clip-path:polygon(8%_0,100%_50%,8%_100%,0_92%,0_8%)] ${theme.triangleShadow}`}
          />
          <span
            className={`relative grid size-full place-items-center bg-gradient-to-br pr-[20%] text-[clamp(.9rem,2.7vw,2rem)] font-extrabold text-white [clip-path:polygon(8%_0,100%_50%,8%_100%,0_92%,0_8%)] ${theme.triangle}`}
          >
            {number}
          </span>
        </span>

        <CalendarIcon />

        <span className="grid font-[var(--heading)] text-[clamp(.5rem,1.25vw,1rem)] leading-[1.1] font-extrabold uppercase">
          <span>{weekday}</span>
          <b className="text-[clamp(1.3rem,5.2vw,3.25rem)] leading-none">
            {day}
          </b>
          <span>{month}</span>
        </span>
      </div>

      <div>
        <h3 className="sr-only">{date}</h3>
        <p className="mt-[clamp(.45rem,1.2vw,1rem)] flex items-center justify-center gap-[clamp(.45rem,1.8vw,1.15rem)] border-t border-[#e4d0f1] pt-[clamp(.45rem,1.5vw,1.2rem)] text-[clamp(.4rem,1.25vw,1.15rem)] leading-[1.3] font-bold">
          <ClockIcon />
          <span>
            <time dateTime={session.startsAt}>
              {hours.format(start)} – {hours.format(end)}
            </time>
            {zone && (
              <span className="block">({zone.replace(/^GMT/, "UTC")})</span>
            )}
          </span>
        </p>
        <p className="sr-only">{labels[availability]}</p>
        {availability === "open" && (
          <a
            className={`absolute inset-1 rounded-lg ${theme.hover}`}
            href={`/webinars/${encodeURIComponent(slug)}/register?session=${encodeURIComponent(session.id)}`}
            aria-label={`Register for this session on ${date}`}
          />
        )}
      </div>
    </li>
  );
}

export function SessionsSection({ event }: { event: PublicEvent }) {
  return (
    <section
      className="relative mx-auto -mt-[.7rem] w-[calc(100%-1.5rem)] lg:-mt-8 lg:w-[min(calc(100%-1.5rem),91%)]"
      aria-labelledby="sessions"
    >
      <h2
        className="relative z-10 mb-[-.7rem] ml-[4.5%] w-fit max-w-[94%] scroll-mt-3 whitespace-nowrap rounded-lg bg-gradient-to-r from-[#40136c] to-[#602489] px-[clamp(1.15rem,3.45vw,2.15rem)] py-[clamp(.4rem,1.1vw,.7rem)] text-center text-[clamp(.38rem,1.3vw,.9rem)] leading-[1.2] font-bold text-white uppercase lg:mb-[-.85rem] lg:ml-[5.7%]"
        id="sessions"
        tabIndex={-1}
      >
        {event.sessions.length === 3 ? "Three live sessions" : "Live sessions"}
        {" — choose what works for you!"}
      </h2>

      {event.sessions.length ? (
        <ul className="grid min-h-0 grid-flow-col auto-cols-fr rounded-[clamp(.7rem,2.25vw,2rem)] border border-[#6532a0] bg-white pt-[clamp(1.55rem,3vw,2.6rem)] pb-[clamp(.7rem,3.25vw,2rem)]">
          {event.sessions.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              slug={event.slug}
              number={index + 1}
              index={index}
            />
          ))}
        </ul>
      ) : (
        <p>No sessions are available yet.</p>
      )}
    </section>
  );
}
