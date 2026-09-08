"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { getModels } from "@/lib/models";

const models = getModels();

/* Hover/click dropdown — no extra deps, keyboard + outside-click aware.
   With `href`, clicking the label navigates (hover still opens the menu). */
function NavMenu({ label, href, children }: { label: string; href?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {href ? (
        <Link
          href={href}
          aria-expanded={open}
          className="flex items-center gap-1 text-sm uppercase tracking-[0.06em] text-[#A9BBD4] transition-colors hover:text-[#F5C46B]"
        >
          {label}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-0.5 opacity-70">
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </Link>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-sm uppercase tracking-[0.06em] text-[#A9BBD4] transition-colors hover:text-[#F5C46B]"
        >
          {label}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-0.5 opacity-70">
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {open && (
        <div className="absolute left-0 top-full min-w-56 pt-3">
          <div className="overflow-hidden rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#0E1730] p-1 shadow-xl shadow-black/40">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-[7px] px-3 py-2 transition-colors hover:bg-[rgba(124,189,242,0.08)]"
    >
      <div className="text-sm uppercase tracking-[0.04em] text-[#E9F1FB] transition-colors group-hover:text-[#F5C46B]">{title}</div>
      {sub && <div className="text-xs normal-case tracking-normal text-[#6E82A0]">{sub}</div>}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(124,189,242,0.14)] bg-[#0A1322]/80 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 font-[family-name:var(--font-jetbrains)]">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            <NavMenu label="Models" href="/models">
              {models.map((m) => (
                <MenuItem key={m.slug} href={`/generate?model=${m.slug}`} title={m.name} sub={m.tagline} />
              ))}
              <MenuItem href="/models" title="All models" sub="Browse the full catalog" />
            </NavMenu>
            <Link
              href="/pricing"
              className="text-sm uppercase tracking-[0.06em] text-[#A9BBD4] transition-colors hover:text-[#F5C46B]"
            >
              Pricing
            </Link>
            <Link
              href="/info"
              aria-label="Info"
              title="Info and contact"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(148,170,200,0.4)] text-[11px] text-[#A9BBD4] transition-colors hover:border-[#F5C46B] hover:text-[#F5C46B]"
            >
              i
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm uppercase tracking-[0.06em]">
          <Link href="/login" className="hidden text-[#A9BBD4] transition-colors hover:text-[#F5C46B] sm:block">
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-[10px] bg-[#7CBDF2] px-5 py-2.5 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8]"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
