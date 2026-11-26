import Image from "next/image";
import type { PublicEvent } from "@/server/public-events";
import styles from "../webinar.module.css";

export function HeroSection({ event }: { event: PublicEvent }) {
  const titleParts = event.title.split("Digital Content");

  return (
    <section className={styles.hero} aria-labelledby="webinar-title">
      <div className={styles.heroContent}>
        <Image
          className={styles.logo}
          src="/pmaa-logo.png"
          alt="PMAA Education Group"
          width={4096}
          height={1498}
          sizes="(max-width: 640px) 34vw, (max-width: 1023px) 25vw, 208px"
          loading="eager"
        />
        <p className={styles.tag}>
          <Image src="/liveicon.png" alt="" width={57} height={43} />
          <span>Live webinar sessions for teachers</span>
        </p>
        <h1 id="webinar-title">
          {titleParts.length === 2 ? (
            <>
              {titleParts[0]}
              <em>Digital Content</em>
              {titleParts[1]}
            </>
          ) : (
            event.title
          )}
        </h1>
        <p className={styles.intro}>{event.intro}</p>
      </div>
      <Image
        className={styles.heroMascot}
        src="/webinar-squirrel.png"
        alt=""
        width={1213}
        height={1296}
        sizes="(max-width: 640px) 46vw, 55vw"
        loading="eager"
      />
    </section>
  );
}
