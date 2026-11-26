import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicFooter, PublicHeader } from "@/components/registered/PublicFrame";
import { RegisteredView, RegistrationNotFound } from "@/components/registered/RegisteredView";
import { Skeleton } from "@/components/ui/skeleton";
import { findConfirmation, publicBaseUrl } from "@/server/public-registrations/confirmation";

export const metadata: Metadata = {
  title: "Your registration · PMAA Education Group",
  // A personal page reached by a secure token: never indexed, and the token never leaves in a Referer header.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = PageProps<"/webinars/[slug]/registered">;

/** Looks up the registration for ?token=… (request-time work, so it streams inside Suspense). */
async function Confirmation({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;
  const confirmation = await findConfirmation(token, slug);
  if (!confirmation || typeof token !== "string") return <RegistrationNotFound slug={slug} />;
  return <RegisteredView confirmation={confirmation} token={token} baseUrl={publicBaseUrl()} />;
}

function ConfirmationSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center">
      <Skeleton className="size-11 rounded-full" />
      <Skeleton className="mt-4 h-11 w-80 max-w-full" />
      <Skeleton className="mt-3 h-5 w-[34rem] max-w-full" />
      <Skeleton className="mt-8 h-80 w-full rounded-2xl" />
    </div>
  );
}

/** /webinars/{slug}/registered: where a teacher lands after registering (doc 08 core-04, T023). */
export default function RegisteredPage(props: Props) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 bg-linear-to-b from-lavender to-white to-[320px] px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-[760px]">
          <Suspense fallback={<ConfirmationSkeleton />}>
            <Confirmation {...props} />
          </Suspense>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
