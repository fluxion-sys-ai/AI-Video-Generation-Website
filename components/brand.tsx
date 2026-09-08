import Link from "next/link";

/* Fluxion icon — three lines converging on a gold node */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M3 9 Q 16 16 29 9" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M3 16 L 29 16" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M3 23 Q 16 16 29 23" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <circle cx="16" cy="16" r="1.6" fill="#D9A45E" />
    </svg>
  );
}

/* Fluxion wordmark: icon + "fluxion" + boxed mono label.
   Defaults to the product mark ("AI VIDEO", internal). Pass boxText="AI" +
   href to the corporate site for the footer mark. */
export function Brand({
  mark = "h-[27px] w-[27px]",
  boxText = "AI VIDEO",
  href = "/",
  external = false,
}: {
  mark?: string;
  boxText?: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <LogoMark className={mark} />
      <span className="flex items-baseline gap-2 font-[family-name:var(--font-jetbrains)] text-[18px] font-medium tracking-[-0.01em]">
        fluxion
        <span className="relative -top-[2px] rounded-[4px] border border-[rgba(148,170,200,0.3)] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[11px] tracking-[0.08em] text-[#A9BBD4]">
          {boxText}
        </span>
      </span>
    </>
  );

  const className = "flex items-center gap-[11px] text-[#E9F1FB]";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
