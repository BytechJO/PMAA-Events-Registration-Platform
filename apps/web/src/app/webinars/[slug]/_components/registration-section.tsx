import Image from "next/image";
import type { PublicEvent } from "@/server/public-events";

export function RegistrationSection({ event }: { event: PublicEvent }) {
  const hasOpenSession = event.sessions.some(
    ({ availability }) => availability === "open",
  );

  return (
    <section
      className="relative isolate min-w-0 overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#3d1168,#612488)] px-[clamp(1rem,2.2vw,1.4rem)] py-[clamp(.9rem,2.2vw,1.35rem)] text-white lg:rounded-3xl lg:px-7 lg:py-7"
      aria-labelledby="register-title"
    >
      <Image
        className="pointer-events-none absolute top-4 right-5 -z-10 h-auto w-[clamp(3.5rem,8vw,4.5rem)] lg:top-6 lg:right-8 lg:w-[6.25rem]"
        src="/elements 1.svg"
        alt=""
        width={72}
        height={97}
      />
      <Image
        className="pointer-events-none absolute top-[30%] right-[15%] -z-10 h-auto w-[clamp(4.5rem,11vw,5.95rem)] lg:top-[31%] lg:w-[8.25rem]"
        src="/elements_1 1.svg"
        alt=""
        width={95}
        height={80}
      />

      <div className="relative z-10 flex flex-col items-start gap-2.5 lg:h-full lg:justify-between lg:gap-0">
        <h2
          id="register-title"
          className="max-w-[62%] [font-family:var(--heading)] text-[clamp(1.1rem,2.35vw,1.55rem)] leading-[1.08] uppercase lg:max-w-[60%] lg:text-[clamp(1.75rem,2vw,2.1rem)]"
        >
          <span className="block font-extrabold">Save your spot</span>
          <span className="block font-medium">and be part of</span>
          <span className="block font-medium">the journey.</span>
        </h2>
        {hasOpenSession && (
          <a
            className="inline-flex min-w-[11rem] justify-center rounded-full bg-[#d93b92] px-6 py-2.5 [font-family:var(--heading)] text-[.95rem] leading-none font-extrabold uppercase transition-colors hover:bg-[#bd247f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:min-w-[16rem] lg:px-10 lg:py-3.5 lg:text-[1.1rem]"
            href="#sessions"
          >
            Register now
          </a>
        )}
        <p className="max-w-[72%] text-[clamp(.55rem,1.05vw,.72rem)] leading-[1.25] lg:max-w-[75%] lg:text-[.875rem]">
          Can’t attend live? Register anyway and we’ll send you the recording.
        </p>
      </div>
    </section>
  );
}
