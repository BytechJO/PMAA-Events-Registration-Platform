import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBody, AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminContentSkeleton, EmptyState } from "@/components/admin/states";
import { Button } from "@/components/ui/button";
import { AdminSection } from "@/server/admin-access";

export const metadata: Metadata = { title: "Events" };

/** /admin/events (doc 08 core-11). The list, search and filters come with T013 and the events tables (T010). */
export default function EventsPage() {
  return (
    <>
      <AdminTopBar
        crumbs={[{ label: "Events" }]}
        actions={
          <Button size="lg" disabled aria-describedby="new-event-note">
            <Plus aria-hidden="true" />
            New event
          </Button>
        }
      />
      <AdminBody>
        <Suspense fallback={<AdminContentSkeleton />}>
          <AdminSection navKey="events">
            <EmptyState
              icon={CalendarDays}
              title="No events yet"
              description="Events appear here with their sessions, registrations and status."
            />
            <p id="new-event-note" className="mt-4 text-center text-xs text-muted-foreground">
              Creating events arrives with the event editor in the next release.
            </p>
          </AdminSection>
        </Suspense>
      </AdminBody>
    </>
  );
}
