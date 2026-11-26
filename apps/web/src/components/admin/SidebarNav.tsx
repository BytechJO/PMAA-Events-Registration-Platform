"use client";

import { Award, CalendarDays, CheckSquare, ClipboardList, Mail, ScrollText, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemForPath, type NavItem, type NavKey } from "@/lib/admin-nav";

const ICONS: Record<NavKey, LucideIcon> = {
  events: CalendarDays,
  registrations: ClipboardList,
  messages: Mail,
  attendance: CheckSquare,
  certificates: Award,
  settings: Settings,
  "audit-log": ScrollText,
};

const SECTIONS = [
  { key: "main", label: null },
  { key: "admin", label: "Admin" },
] as const;

const itemBase = "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px]";

/** The admin menu for a given path: active item marked, later-release items grayed out and not clickable. */
export function SidebarNavList({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  const active = navItemForPath(pathname)?.key;
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.section === section.key);
        if (list.length === 0) return null;
        const headingId = `nav-section-${section.key}`;
        return (
          <div key={section.key} className="flex flex-col gap-0.5">
            {section.label && (
              <p id={headingId} className="px-2.5 pt-3 pb-1 text-[10.5px] font-medium tracking-[.08em] text-muted-foreground uppercase">
                {section.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5" aria-labelledby={section.label ? headingId : undefined}>
              {list.map((item) => {
                const Icon = ICONS[item.key];
                if (!item.available) {
                  return (
                    <li key={item.key}>
                      <span aria-disabled="true" data-nav={item.key} title="Arrives in a later release" className={`${itemBase} cursor-not-allowed text-nav-disabled`}>
                        <Icon aria-hidden="true" className="size-4" />
                        {item.label}
                        <span className="sr-only"> (arrives in a later release)</span>
                      </span>
                    </li>
                  );
                }
                const current = item.key === active;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      data-nav={item.key}
                      aria-current={current ? "page" : undefined}
                      onClick={onNavigate}
                      className={`${itemBase} outline-none focus-visible:ring-3 focus-visible:ring-ring/60 ${
                        current ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function SidebarNav(props: { items: NavItem[]; onNavigate?: () => void }) {
  return <SidebarNavList {...props} pathname={usePathname() ?? ""} />;
}
