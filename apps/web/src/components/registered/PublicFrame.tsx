import { publicSite } from "@/config/public-site";

/*
 * Header and footer of the public pages (doc 08 core-04). WBR-22 (public event page) builds the shared
 * public frame at the same time; whichever lands second switches to the shared one.
 */

function PmaaLogo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-brand">
      <svg viewBox="0 0 40 36" aria-hidden="true" className="h-9 w-10">
        <path d="M3 9 L18 4 L18 30 L3 34 Z" fill="currentColor" opacity=".9" />
        <path d="M20 4 L36 9 L36 31 L20 30 Z" fill="currentColor" opacity=".55" />
        <circle cx="27" cy="17" r="4" fill="#d6338a" />
      </svg>
      <span className="flex flex-col">
        <span className="font-display text-[26px] leading-none font-bold tracking-[.02em]">PMAA</span>
        <span className="mt-0.5 text-[10px] leading-none font-semibold tracking-[.16em]">EDUCATION GROUP</span>
      </span>
    </span>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-8">
        <a href={publicSite.websiteUrl} className="rounded-md">
          <PmaaLogo />
        </a>
        <nav aria-label="PMAA" className="hidden items-center gap-8 text-[15px] text-muted-foreground sm:flex">
          <a className="hover:text-brand" href={publicSite.websiteUrl}>
            Webinars
          </a>
          <a className="hover:text-brand" href={publicSite.websiteUrl}>
            Workshops
          </a>
          <a className="hover:text-brand" href={`mailto:${publicSite.supportEmail}`}>
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <a className="hover:underline" href={publicSite.websiteUrl}>
          {publicSite.websiteLabel}
        </a>
        <span className="text-white/85">{publicSite.tagline}</span>
      </div>
    </footer>
  );
}
