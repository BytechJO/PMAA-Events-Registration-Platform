import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBody, AdminTopBar } from "@/components/admin/AdminTopBar";
import { SignInRequired } from "@/components/admin/SignInRequired";
import { AdminContentSkeleton, AdminForbiddenView } from "@/components/admin/states";
import { navFor } from "@/lib/admin-nav";
import { devChoices, shellUser } from "@/server/admin-access";
import { getAdminSession } from "@/server/session";

export const metadata: Metadata = {
  title: { template: "%s · PMAA Admin", default: "PMAA Admin" },
  robots: { index: false, follow: false },
};

/** Who is signed in decides the frame: sign-in screen, "not allowed" (no role, AT-11) or the admin shell. */
async function AdminFrame({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const choices = devChoices();
  if (!session) return <SignInRequired devChoices={choices} />;
  if (session.grants.length === 0) {
    return (
      <AdminShell nav={[]} user={shellUser(session)} devChoices={choices}>
        <AdminTopBar crumbs={[{ label: "Not allowed" }]} />
        <AdminBody>
          <AdminForbiddenView />
        </AdminBody>
      </AdminShell>
    );
  }
  return (
    <AdminShell nav={navFor(session)} user={shellUser(session)} devChoices={choices}>
      {children}
    </AdminShell>
  );
}

function FrameFallback() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden w-[232px] flex-none border-r border-border bg-sidebar lg:block" />
      <div className="flex-1 p-6">
        <AdminContentSkeleton />
      </div>
    </div>
  );
}

/** /admin: PMAA staff only (spec §3, §9). Reading the session is request-time work, so it streams behind a skeleton. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<FrameFallback />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
