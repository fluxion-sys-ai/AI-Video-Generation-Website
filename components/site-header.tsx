"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { getModels } from "@/lib/models";
import { getUser, isSignedIn, type User } from "@/lib/auth";

const models = getModels();

/* Hover/click dropdown - no extra deps, keyboard + outside-click aware.
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

function MenuItem({ href, title, sub, icon }: { href: string; title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[7px] px-3 py-2 transition-colors hover:bg-[rgba(124,189,242,0.08)]"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>
        <span className="block text-sm uppercase tracking-[0.04em] text-[#E9F1FB] transition-colors group-hover:text-[#F5C46B]">{title}</span>
        {sub && <span className="block text-xs normal-case tracking-normal text-[#6E82A0]">{sub}</span>}
      </span>
    </Link>
  );
}

// small square icon chip with the model initial
function ModelIcon({ letter }: { letter: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-[rgba(255,138,30,0.12)] font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-[#FF8A1E]">
      {letter}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(isSignedIn() ? getUser() : null);
    setReady(true);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(124,189,242,0.14)] bg-[#070D1A]/80 backdrop-blur">
      <nav className="flex h-20 items-center justify-between px-8 font-[family-name:var(--font-jetbrains)]">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            <NavMenu label="Models" href="/models">
              {models.map((m) => (
                <MenuItem
                  key={m.slug}
                  href={`/generate?model=${m.slug}`}
                  title={m.name}
                  sub={m.tagline}
                  icon={<ModelIcon letter={m.name.charAt(0)} />}
                />
              ))}
              <MenuItem
                href="/models"
                title="All models"
                sub="Browse the full catalog"
                icon={
                  <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(124,189,242,0.35)] bg-[rgba(124,189,242,0.1)] text-[#7CBDF2]">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
                      <rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" />
                      <rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" />
                    </svg>
                  </span>
                }
              />
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
          {ready && user ? (
            <Link href="/profile" className="group flex items-center gap-2" title="Your profile">
              <span className="hidden max-w-[160px] truncate normal-case text-[#E9F1FB] transition-colors group-hover:text-[#FF8A1E] sm:block">
                {user.name}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF8A1E] font-medium text-[#0A1322]">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden text-[#A9BBD4] transition-colors hover:text-[#F5C46B] sm:block">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
