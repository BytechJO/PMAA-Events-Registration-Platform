/** PMAA Education Group mark for the admin (placeholder from the newsletter until the final files arrive, B4). */
export function AdminLogo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${light ? "text-white" : "text-brand"}`}>
      <svg viewBox="0 0 40 36" aria-hidden="true" className="h-6 w-[27px]">
        <path d="M3 9 L18 4 L18 30 L3 34 Z" fill="currentColor" opacity=".9" />
        <path d="M20 4 L36 9 L36 31 L20 30 Z" fill="currentColor" opacity=".55" />
        <circle cx="27" cy="17" r="4" fill="#d6338a" />
      </svg>
      <span className="flex flex-col">
        <span className="font-display text-[17px] leading-none font-bold tracking-[.02em]">PMAA</span>
        <span className="text-[7.5px] leading-[1.5] font-medium tracking-[.14em]">EDUCATION GROUP</span>
      </span>
    </span>
  );
}
