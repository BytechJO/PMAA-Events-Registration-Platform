"use client";

import { MenuIcon } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { NavItem } from "@/lib/admin-nav";
import { AdminLogo } from "./AdminLogo";
import { SidebarNav } from "./SidebarNav";
import { UserMenu, type DevChoices, type ShellUser } from "./UserMenu";

const MobileNav = createContext<() => void>(() => {});

/** Opens the menu drawer below desktop width (doc 08: "navigation collapses and stays usable"). */
export function MobileNavButton() {
  const open = useContext(MobileNav);
  return (
    <Button variant="ghost" size="icon" className="-ml-1 lg:hidden" onClick={open} aria-label="Open menu">
      <MenuIcon aria-hidden="true" />
    </Button>
  );
}

interface ShellProps {
  nav: NavItem[];
  user: ShellUser;
  devChoices: DevChoices;
}

function SidebarBody({ nav, user, devChoices, onNavigate }: ShellProps & { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-2.5 pt-1 pb-4">
        <AdminLogo />
      </div>
      <SidebarNav items={nav} onNavigate={onNavigate} />
      <div className="mt-auto pt-4">
        <UserMenu user={user} devChoices={devChoices} />
      </div>
    </>
  );
}

/** Admin frame from doc 08 core-11: left menu, then each page's top bar and content. */
export function AdminShell({ children, ...props }: ShellProps & { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNav.Provider value={() => setOpen(true)}>
      <div className="flex min-h-screen bg-canvas text-foreground">
        <a
          href="#admin-content"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <aside className="sticky top-0 hidden h-screen w-[232px] flex-none flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
          <SidebarBody {...props} />
        </aside>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[260px] gap-0 bg-sidebar px-3 py-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Admin sections</SheetDescription>
            <SidebarBody {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MobileNav.Provider>
  );
}
