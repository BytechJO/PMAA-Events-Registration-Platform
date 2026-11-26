import { CircleAlert, FileQuestion, ShieldX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/*
 * The states every admin page shares: empty, loading, error, not allowed and not found.
 * Messages are safe to show: no stack traces, provider errors or personal data (spec §13 response rule).
 */

function StatePanel({ icon: Icon, tone, title, children, testId }: { icon: LucideIcon; tone: string; title: string; children: ReactNode; testId: string }) {
  return (
    <section data-state={testId} className="mx-auto mt-6 flex max-w-lg flex-col items-center rounded-xl border border-border bg-card px-6 py-10 text-center">
      <span aria-hidden="true" className={`mb-4 flex size-12 items-center justify-center rounded-full ${tone}`}>
        <Icon className="size-6" />
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 flex flex-col items-center gap-4 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

const linkButton =
  "inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function EmptyState({ icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <StatePanel icon={icon} tone="bg-brand-soft text-brand" title={title} testId="empty">
      <p>{description}</p>
      {action}
    </StatePanel>
  );
}

export function AdminErrorView({ reference, retry }: { reference?: string; retry?: ReactNode }) {
  return (
    <StatePanel icon={CircleAlert} tone="bg-[#fdeceb] text-destructive" title="Something went wrong" testId="error">
      <p>This page could not load. Try again; if it keeps happening, send the reference below to the Tech Lead.</p>
      {reference && (
        <p className="font-mono text-xs">
          Reference: <span data-testid="error-reference">{reference}</span>
        </p>
      )}
      {retry}
    </StatePanel>
  );
}

export function AdminForbiddenView() {
  return (
    <StatePanel icon={ShieldX} tone="bg-warn-soft text-warn" title="You don't have access to this page" testId="forbidden">
      <p>Your role does not include this section. Ask a Super Admin if you need it.</p>
    </StatePanel>
  );
}

export function AdminNotFoundView() {
  return (
    <StatePanel icon={FileQuestion} tone="bg-brand-soft text-brand" title="Page not found" testId="not-found">
      <p>This admin page does not exist, or it arrives in a later release.</p>
      <Link href="/admin/events" className={linkButton}>
        Go to Events
      </Link>
    </StatePanel>
  );
}

/** Placeholder while a section loads; same rough shape as a list page, so nothing jumps. */
export function AdminContentSkeleton() {
  return (
    <div data-state="loading" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading</span>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 bg-border" />
        <Skeleton className="h-9 w-32 bg-border" />
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full bg-muted" />
        ))}
      </div>
    </div>
  );
}
