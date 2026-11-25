"use client";

import { ChevronsUpDown, LogOut, UserRoundCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export interface ShellUser {
  name: string;
  roleLabel: string;
  initials: string;
}

/** Roles offered by the local test sign-in; null when it is off. */
export type DevChoices = { value: string; label: string }[] | null;

/** Bottom of the menu: who is signed in and with which role (core-11). Test sign-in adds role switching. */
export function UserMenu({ user, devChoices }: { user: ShellUser; devChoices: DevChoices }) {
  const devSignIn = devChoices !== null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          <span aria-hidden="true" className="flex size-[30px] flex-none items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
            {user.initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground" data-testid="user-role">
              {user.roleLabel}
            </span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              Signed in as {user.roleLabel}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          {devChoices && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Switch test role</DropdownMenuLabel>
                {devChoices.map((choice) => (
                  <DropdownMenuItem key={choice.value} render={<button type="submit" form="dev-role-form" name="role" value={choice.value} className="w-full" />}>
                    <UserRoundCog aria-hidden="true" />
                    {choice.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<button type="submit" form="dev-sign-out-form" className="w-full" />}>
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {devSignIn && (
        <>
          <form id="dev-role-form" method="post" action="/api/dev/sign-in" hidden />
          <form id="dev-sign-out-form" method="post" action="/api/dev/sign-out" hidden />
        </>
      )}
    </>
  );
}
