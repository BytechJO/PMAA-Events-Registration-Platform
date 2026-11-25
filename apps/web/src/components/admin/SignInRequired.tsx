import { AdminLogo } from "./AdminLogo";
import type { DevChoices } from "./UserMenu";

/**
 * Shown on any admin page without a signed-in admin. The Microsoft sign-in (core-09) comes with T011;
 * on a developer machine with ADMIN_DEV_SIGN_IN, a test sign-in lets you pick a role.
 */
export function SignInRequired({ devChoices }: { devChoices: DevChoices }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas md:flex-row">
      <div className="relative flex flex-col overflow-hidden bg-[linear-gradient(150deg,#3b1a6b,#5a2d9c_70%,#8d5bd1)] px-8 py-10 text-white md:w-[44%] md:max-w-[520px] md:px-12 md:py-12">
        <AdminLogo light />
        <h1 className="mt-10 font-display text-[28px] leading-[1.15] font-bold md:mt-28 md:text-[34px]">
          Webinars &amp; Workshops
          <br />
          Administration
        </h1>
        <p className="mt-3 max-w-sm text-white/85">Create events, manage registrations and follow every email sent to teachers.</p>
      </div>
      <main id="admin-content" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-8">
          <h2 className="text-[22px] font-bold text-foreground">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign-in with your PMAA Microsoft work account is not switched on yet. Only staff on the PMAA admin list will be able to sign in.
          </p>
          {devChoices && (
            <form method="post" action="/api/dev/sign-in" className="mt-6 border-t border-border pt-5">
              <fieldset>
                <legend className="text-sm font-semibold text-foreground">Test sign-in (this computer only)</legend>
                <p className="mt-1 text-xs text-muted-foreground">Pick a role to see the admin as that role. Never available on staging or production.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {devChoices.map((c) => (
                    <button
                      key={c.value}
                      type="submit"
                      name="role"
                      value={c.value}
                      className="h-10 rounded-lg border border-input bg-background px-3 text-left text-sm font-medium text-foreground hover:border-ring hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
