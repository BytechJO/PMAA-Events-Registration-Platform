import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBody, AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminContentSkeleton, EmptyState } from "@/components/admin/states";
import { AdminSection } from "@/server/admin-access";

export const metadata: Metadata = { title: "Registrations" };

/** /admin/registrations. The list with search, filters and detail comes with T027. */
export default function RegistrationsPage() {
  return (
    <>
      <AdminTopBar crumbs={[{ label: "Registrations" }]} />
      <AdminBody>
        <Suspense fallback={<AdminContentSkeleton />}>
          <AdminSection navKey="registrations">
            <EmptyState
              icon={ClipboardList}
              title="No registrations yet"
              description="Teachers who register on the public webinar pages appear here, with search and filters."
            />
          </AdminSection>
        </Suspense>
      </AdminBody>
    </>
  );
}
