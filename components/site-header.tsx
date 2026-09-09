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

// blue icon chip for the profile tab menu
function TabChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(124,189,242,0.35)] bg-[rgba(124,189,242,0.1)] text-[#7CBDF2]">
      {children}
    </span>
  );
}

const PROFILE_TABS: { key: string; title: string; icon: React.ReactNode }[] = [
  {
    key: "account",
    title: "Account",
    icon: (
      <TabChip>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="5" r="2.5" />
          <path d="M3 14c0-3 2.5-4.5 5-4.5s5 1.5 5 4.5" strokeLinecap="round" />
        </svg>
      </TabChip>
    ),
  },
  {
    key: "billing",
    title: "Billing",
    icon: (
      <TabChip>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v6M6.6 9.4c.3.6.9.9 1.4.9.9 0 1.4-.5 1.4-1.1 0-1.5-2.8-.9-2.8-2.3 0-.6.6-1.1 1.4-1.1.6 0 1.1.3 1.4.8" strokeLinecap="round" />
        </svg>
      </TabChip>
    ),
  },
  {
    key: "payment",
    title: "Payment",
    icon: (
      <TabChip>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="4" width="12" height="8" rx="1.5" />
          <path d="M2 7h12" />
        </svg>
      </TabChip>
    ),
  },
  {
    key: "usage",
    title: "Usage",
    icon: (
      <TabChip>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 13V8M7 13V3.5M11 13V10" strokeLinecap="round" />
        </svg>
      </TabChip>
    ),
  },
  {
    key: "preferences",
    title: "Settings",
    icon: (
      <TabChip>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="8" cy="8" r="2.2" />
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" strokeLinecap="round" />
        </svg>
      </TabChip>
    ),
  },
];

// Profile avatar with a hover dropdown of the profile tabs.
function ProfileMenu({ user }: { user: User }) {
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
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link href="/profile" aria-expanded={open} className="group flex items-center gap-2" title="Your profile">
        <span className="hidden max-w-[160px] truncate normal-case text-[#E9F1FB] transition-colors group-hover:text-[#FF8A1E] sm:block">
          {user.name}
        </span>
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#FF8A1E] font-medium text-[#0A1322]">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
      </Link>
      {open && (
        <div className="absolute right-0 top-full min-w-52 pt-3">
          <div className="overflow-hidden rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#0E1730] p-1 shadow-xl shadow-black/40">
            {PROFILE_TABS.map((t) => (
              <MenuItem key={t.key} href={`/profile?tab=${t.key}`} title={t.title} icon={t.icon} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Marketing routes always show the public bar; app routes always show the
// dashboard bar. Shared routes (/profile, /generate, /models) inherit the last
// mode, so clicking the avatar from a public page keeps you in public mode.
const ALWAYS_PUBLIC = ["/", "/pricing", "/info", "/login", "/signup"];
const ALWAYS_DASH = ["/dashboard", "/library", "/settings"];
const MODE_KEY = "fluxion.mode";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm uppercase tracking-[0.06em] transition-colors ${
        active ? "text-[#FF8A1E]" : "text-[#A9BBD4] hover:text-[#F5C46B]"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"public" | "dashboard">("public");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(isSignedIn() ? getUser() : null);
    let m = (localStorage.getItem(MODE_KEY) as "public" | "dashboard") || "public";
    if (ALWAYS_PUBLIC.includes(pathname)) m = "public";
    else if (ALWAYS_DASH.some((p) => pathname.startsWith(p))) m = "dashboard";
    localStorage.setItem(MODE_KEY, m);
    setMode(m);
    setReady(true);
  }, [pathname]);

  const dashMode = ready && !!user && mode === "dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(124,189,242,0.14)] bg-[#070D1A]/80 backdrop-blur">
      <nav className="flex h-20 items-center justify-between px-8 font-[family-name:var(--font-jetbrains)]">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            {dashMode ? (
              <>
                <NavLink href="/dashboard" label="Dashboard" active={pathname.startsWith("/dashboard")} />
                <NavLink href="/generate" label="Generate" active={pathname.startsWith("/generate") || pathname.startsWith("/models")} />
                <NavLink href="/library" label="Library" active={pathname.startsWith("/library")} />
                <NavLink href="/profile" label="Profile" active={pathname.startsWith("/profile")} />
                <NavLink href="/profile?tab=preferences" label="Settings" active={pathname.startsWith("/settings")} />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm uppercase tracking-[0.06em]">
          {ready && user ? (
            <>
              {!dashMode && (
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-1.5 border border-[rgba(255,138,30,0.55)] px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-[#FF8A1E] transition-colors hover:bg-[rgba(255,138,30,0.1)] sm:flex"
                >
                  <span className="text-sm leading-none">+</span>
                  Create
                </Link>
              )}
              <ProfileMenu user={user} />
            </>
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
