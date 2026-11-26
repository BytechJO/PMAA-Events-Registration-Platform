import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getPublicEvent } from "@/server/public-events";
import { BenefitsSection } from "./_components/benefits-section";
import { CertificateSection } from "./_components/certificate-section";
import { HeroSection } from "./_components/hero-section";
import { LearningSection } from "./_components/learning-section";
import { RegistrationSection } from "./_components/registration-section";
import { SessionsSection } from "./_components/sessions-section";
import { WebinarFooter } from "./_components/webinar-footer";
import styles from "./webinar.module.css";

export const metadata: Metadata = {
  title: "Teacher Webinars | PMAA Education Group",
  robots: { index: false },
};

async function Webinar({ params }: PageProps<"/webinars/[slug]">) {
  const { slug } = await params;
  await connection();
  const event = getPublicEvent(slug);
  if (!event) notFound();

  return (
    <div className={styles.page}>
      <main>
        <HeroSection event={event} />
        <SessionsSection event={event} />
        <LearningSection event={event} />
        <div className={`${styles.wrap} ${styles.promos}`}>
          <CertificateSection event={event} />
          <RegistrationSection event={event} />
        </div>
        <div className="relative mx-auto my-[.85rem] w-[calc(100%-1.5rem)] lg:w-[min(calc(100%-1.5rem),91%)]">
          <BenefitsSection />
          <Image
            className="pointer-events-none absolute right-0 bottom-0 z-10 hidden h-auto w-[clamp(7.5rem,12vw,10rem)] lg:block"
            src="/webinar-squirrel-small.png"
            alt=""
            width={190}
            height={237}
          />
        </div>
      </main>
      <WebinarFooter />
    </div>
  );
}

export default function WebinarPage(props: PageProps<"/webinars/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Webinar {...props} />
    </Suspense>
  );
}
