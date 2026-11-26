import Image from "next/image";
import type { PublicEvent } from "@/server/public-events";

export function CertificateSection({ event }: { event: PublicEvent }) {
  return (
    <section
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_46%] items-center gap-2 rounded-2xl border border-[#9d5ed2] bg-[#fbf8fd] px-[clamp(.75rem,2.2vw,1.35rem)] py-[clamp(.75rem,2.2vw,1.35rem)] text-[#35105d] lg:rounded-3xl lg:px-7 lg:py-7"
      aria-labelledby="certificate-title"
    >
      <div className="flex flex-col items-start gap-4 lg:gap-6">
        <h2
          id="certificate-title"
          className="[font-family:var(--heading)] text-[clamp(.9rem,2vw,1.35rem)] leading-[1.15] font-extrabold uppercase lg:text-[clamp(1.55rem,1.7vw,1.85rem)]"
        >
          Your effort.
          <br />
          Our appreciation.
        </h2>
        <p className="max-w-[18rem] text-[clamp(.72rem,1.4vw,.9rem)] leading-[1.55] lg:text-[1rem]">
          {event.certificateNote}
        </p>
      </div>
      <Image
        className="h-auto w-full"
        src="/webinar-certificate.png"
        alt="Certificate of attendance preview"
        width={243}
        height={181}
      />
    </section>
  );
}
