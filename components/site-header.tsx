"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { getModels } from "@/lib/models";
import { getUser, isSignedIn, type User } from "@/lib/auth";
import { Settings } from "lucide-react";

const models = getModels();

/* Hover/click dropdown - no extra deps, keyboard + outside-click aware.
   With `href`, clicking the label navigates (hover still opens the menu). */
function NavMenu({ label, href, align = "left", children }: { label: React.ReactNode; href?: string; align?: "left" | "right"; children: React.ReactNode }) {
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
          className="flex items-center gap-1 text-sm uppercase tracking-[0.06em] text-fg-soft-2 transition-colors hover:text-gold-soft"
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
          className="flex items-center gap-1 text-sm uppercase tracking-[0.06em] text-fg-soft-2 transition-colors hover:text-gold-soft"
        >
          {label}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-0.5 opacity-70">
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {open && (
        <div className={`absolute top-full min-w-56 pt-3 ${align === "right" ? "right-0" : "left-0"}`}>
          <div className="overflow-hidden rounded-[10px] border border-hairline bg-panel p-1 shadow-xl shadow-black/40">
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
      className="group flex items-center gap-3 rounded-[7px] px-3 py-2 transition-colors hover:bg-hover"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>
        <span className="block text-sm uppercase tracking-[0.04em] text-fg transition-colors group-hover:text-gold-soft">{title}</span>
        {sub && <span className="block text-xs normal-case tracking-normal text-dim">{sub}</span>}
      </span>
    </Link>
  );
}

// small square icon chip with the model initial
function ModelIcon({ letter }: { letter: string }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent">
      {letter}
    </span>
  );
}

// blue icon chip for the profile tab menu
function TabChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(124,189,242,0.35)] bg-[rgba(124,189,242,0.1)] text-blue">
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
    title: "Preferences",
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
        <span className="hidden max-w-[160px] truncate normal-case text-fg transition-colors group-hover:text-accent sm:block">
          {user.name}
        </span>
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent font-medium text-ink">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
      </Link>
      {open && (
        <div className="absolute right-0 top-full min-w-52 pt-3">
          <div className="overflow-hidden rounded-[10px] border border-hairline bg-panel p-1 shadow-xl shadow-black/40">
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
        active ? "text-accent" : "text-fg-soft-2 hover:text-gold-soft"
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

  // Clear/transparent top bar: no solid fill — the page (and its decorative
  // background) shows straight through. A light backdrop-blur keeps the nav
  // legible over busy content, and a faint hairline separates it.
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-transparent backdrop-blur-md">
      <nav className="flex h-20 items-center justify-between px-10 font-[family-name:var(--font-jetbrains)]">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-7 md:flex">
            {dashMode ? (
              <>
                <NavMenu label="Dashboard" href="/dashboard">
                  <MenuItem href="/dashboard" title="Main" icon={<TabChip><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 7.5 L8 3 L13.5 7.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 6.8V13h8V6.8" strokeLinecap="round" strokeLinejoin="round" /></svg></TabChip>} />
                  <MenuItem href="/dashboard#models" title="My models" sub="Recents & favorites" icon={<TabChip><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" /><rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" /></svg></TabChip>} />
                </NavMenu>
                <NavMenu label="Generate" href="/generate">
                  {models.map((m) => (
                    <MenuItem key={m.slug} href={`/generate?model=${m.slug}`} title={m.name} sub={m.tagline} icon={<ModelIcon letter={m.name.charAt(0)} />} />
                  ))}
                  <MenuItem href="/models" title="All models" sub="Browse the full catalog" icon={<TabChip><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" /><rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" /></svg></TabChip>} />
                </NavMenu>
                <NavMenu label="Library" href="/library">
                  <MenuItem href="/library?tab=images" title="Images" icon={<TabChip><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="12" height="10" rx="1.5" /><circle cx="6" cy="6.5" r="1.2" /><path d="M3 12 L6.5 8.5 L9 11 L11 9 L13.5 12" strokeLinecap="round" strokeLinejoin="round" /></svg></TabChip>} />
                  <MenuItem href="/library?tab=videos" title="Videos" icon={<TabChip><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3.5" width="9" height="9" rx="1.5" /><path d="M11 7 L14 5.2 V10.8 L11 9" strokeLinecap="round" strokeLinejoin="round" /></svg></TabChip>} />
                </NavMenu>
                <NavLink href="/docs" label="Docs" active={pathname.startsWith("/docs")} />
                <NavMenu
                  align="right"
                  href="/profile"
                  label={
                    <span aria-label="Settings" title="Settings" className="flex h-6 w-6 items-center justify-center">
                      <Settings size={17} strokeWidth={1.6} />
                    </span>
                  }
                >
                  {PROFILE_TABS.map((t) => (
                    <MenuItem key={t.key} href={`/profile?tab=${t.key}`} title={t.title} icon={t.icon} />
                  ))}
                </NavMenu>
                <Link
                  href="/info"
                  aria-label="Info"
                  title="Info and contact"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(148,170,200,0.4)] text-[11px] text-fg-soft-2 transition-colors hover:border-gold-soft hover:text-gold-soft"
                >
                  i
                </Link>
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
                  <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(124,189,242,0.35)] bg-[rgba(124,189,242,0.1)] text-blue">
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
              className="text-sm uppercase tracking-[0.06em] text-fg-soft-2 transition-colors hover:text-gold-soft"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-sm uppercase tracking-[0.06em] text-fg-soft-2 transition-colors hover:text-gold-soft"
            >
              Docs
            </Link>
            <Link
              href="/info"
              aria-label="Info"
              title="Info and contact"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(148,170,200,0.4)] text-[11px] text-fg-soft-2 transition-colors hover:border-gold-soft hover:text-gold-soft"
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
                  className="hidden items-center border border-accent-border px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-accent transition-colors hover:bg-accent-soft sm:flex"
                >
                  Create
                </Link>
              )}
              <ProfileMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-fg-soft-2 transition-colors hover:text-gold-soft sm:block">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-[10px] bg-accent px-5 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover"
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
