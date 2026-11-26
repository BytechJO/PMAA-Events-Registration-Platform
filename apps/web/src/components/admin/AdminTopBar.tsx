import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNavButton } from "./AdminShell";

export interface Crumb {
  label: string;
  href?: string;
}

/** Top bar of an admin page: menu button below desktop width, breadcrumbs, page actions (core-11). */
export function AdminTopBar({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-[58px] flex-none items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
      <MobileNavButton />
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 flex-none" />}
                {last || !c.href ? (
                  <span aria-current={last ? "page" : undefined} className={`truncate ${last ? "font-semibold text-foreground" : ""}`}>
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="truncate rounded-sm hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none">
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Content area under the top bar; the skip link jumps here. */
export function AdminBody({ children }: { children: ReactNode }) {
  return (
    <main id="admin-content" tabIndex={-1} className="flex-1 px-4 py-5 outline-none sm:px-6">
      {children}
    </main>
  );
}
