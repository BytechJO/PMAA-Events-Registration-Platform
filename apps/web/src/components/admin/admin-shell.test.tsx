import type { Role } from "@pmaa/core";
import { CalendarDays } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { navFor } from "@/lib/admin-nav";
import { AdminTopBar } from "./AdminTopBar";
import { SidebarNavList } from "./SidebarNav";
import { AdminContentSkeleton, AdminErrorView, AdminForbiddenView, AdminNotFoundView, EmptyState } from "./states";

const menu = (role: Role, pathname = "/admin/events") =>
  renderToStaticMarkup(<SidebarNavList items={navFor({ userId: "u", grants: [{ role }] })} pathname={pathname} />);

/** [key, "link" | "disabled", current?] for each menu entry, in order. */
function entries(html: string) {
  return [...html.matchAll(/<(a|span) [^>]*data-nav="([^"]+)"[^>]*>/g)].map((m) => [m[2], m[1] === "a" ? "link" : "disabled", m[0].includes('aria-current="page"')]);
}

describe("admin menu per role", () => {
  it("Super Admin: Events and Registrations are links, later sections are grayed out", () => {
    expect(entries(menu("super_admin"))).toEqual([
      ["events", "link", true],
      ["registrations", "link", false],
      ["messages", "disabled", false],
      ["attendance", "disabled", false],
      ["certificates", "disabled", false],
      ["settings", "disabled", false],
      ["audit-log", "disabled", false],
    ]);
  });

  it("marks the section of the current page, also on its sub-pages", () => {
    expect(entries(menu("super_admin", "/admin/registrations/reg_1")).filter((e) => e[2])).toEqual([["registrations", "link", true]]);
  });

  it("Read-only sees no staff or admin sections, and no Admin heading", () => {
    const html = menu("read_only");
    expect(entries(html).map((e) => e[0])).toEqual(["events", "registrations"]);
    expect(html).not.toContain(">Admin<");
  });

  it("grayed-out items say why to screen readers and are not links", () => {
    const html = menu("super_admin");
    expect(html).toMatch(/<span aria-disabled="true" data-nav="messages"[^>]*>.*\(arrives in a later release\)/);
    expect(html).not.toContain('href="/admin/messages"');
  });
});

describe("admin states", () => {
  it("empty state shows its title and explanation", () => {
    const html = renderToStaticMarkup(<EmptyState icon={CalendarDays} title="No events yet" description="Events appear here." />);
    expect(html).toContain('data-state="empty"');
    expect(html).toContain("No events yet");
    expect(html).toContain("Events appear here.");
  });

  it("loading state is announced as busy", () => {
    const html = renderToStaticMarkup(<AdminContentSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading");
  });

  it("error state gives a safe message, the reference and a retry control", () => {
    const html = renderToStaticMarkup(<AdminErrorView reference="abc123" retry={<button>Try again</button>} />);
    expect(html).toContain("Something went wrong");
    expect(html).toContain('<span data-testid="error-reference">abc123</span>');
    expect(html).toContain("Try again");
  });

  it("not allowed and not found pages explain what to do", () => {
    expect(renderToStaticMarkup(<AdminForbiddenView />)).toContain("Ask a Super Admin");
    expect(renderToStaticMarkup(<AdminNotFoundView />)).toContain('href="/admin/events"');
  });
});

describe("AdminTopBar", () => {
  it("renders breadcrumbs with the current page last and links before it", () => {
    const html = renderToStaticMarkup(<AdminTopBar crumbs={[{ label: "Events", href: "/admin/events" }, { label: "New event" }]} />);
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('href="/admin/events"');
    expect(html).toMatch(/<span aria-current="page"[^>]*>New event<\/span>/);
    expect(html).toContain('aria-label="Open menu"');
  });
});
