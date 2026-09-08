"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { getModels } from "@/lib/models";

const models = getModels();

/* Hover/click dropdown — no extra deps, keyboard + outside-click aware. */
function NavMenu({ label, children }: { label: string; children: React.ReactNode }) {
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
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-base text-[#A9BBD4] transition-colors hover:text-[#E9F1FB]"
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-0.5 opacity-70">
          <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
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
      className="block rounded-[7px] px-3 py-2 transition-colors hover:bg-[rgba(124,189,242,0.08)]"
    >
      <div className="text-sm text-[#E9F1FB]">{title}</div>
      {sub && <div className="text-xs text-[#6E82A0]">{sub}</div>}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(124,189,242,0.14)] bg-[#0A1322]/80 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            <NavMenu label="Models">
              {models.map((m) => (
                <MenuItem key={m.slug} href={`/generate?model=${m.slug}`} title={m.name} sub={m.tagline} />
              ))}
              <MenuItem href="/models" title="All models" sub="Browse the full catalog" />
            </NavMenu>
            <NavMenu label="Pricing">
              <MenuItem href="/pricing#free" title="Free" sub="Try it out" />
              <MenuItem href="/pricing#pro" title="Pro" sub="For regular use" />
              <MenuItem href="/pricing#studio" title="Studio" sub="For teams" />
            </NavMenu>
          </div>
        </div>
        <div className="flex items-center gap-4 text-base">
          <Link href="/login" className="hidden text-[#A9BBD4] transition-colors hover:text-[#E9F1FB] sm:block">
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
