"use client";

/* ============================================================================
   Skin-specific DASHBOARD layouts. Same data + links + functionality, different
   structure per skin. The page (app/dashboard/page.tsx) does the auth guard +
   data loading, then hands the data to one of these based on useSkin().
   ============================================================================ */

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getModel, type Model } from "@/lib/models";

export type DashData = {
  name: string;
  favs: string[];
  recents: string[];
  models: Model[];
};

const STEPS = [
  { title: "Create account", desc: "You're signed in and ready.", href: "/profile?tab=account", done: true },
  { title: "Set up billing", desc: "Add a payment method.", href: "/profile?tab=payment", done: false },
  { title: "Get credits", desc: "Top up your balance.", href: "/profile?tab=billing", done: false },
  { title: "Get API key", desc: "Generate video over HTTP.", href: "/docs#keys", done: false },
];

const LINKS = [
  { title: "New generation", desc: "Pick a model and prompt.", href: "/generate" },
  { title: "Browse models", desc: "Compare the catalog.", href: "/models" },
  { title: "Library", desc: "Your videos and uploads.", href: "/library" },
  { title: "Documentation", desc: "Guides and API reference.", href: "/docs" },
];

const SNAPSHOT = (models: Model[]): [string, string][] => [
  ["Credit balance", "$0.00"],
  ["Generations", "0"],
  ["This month", "$0.00"],
  ["Saved models", String(models.length)],
];

/* ------------------------------------------------------------------- OG ---- */
function OGChip({ slug }: { slug: string }) {
  const m = getModel(slug);
  if (!m) return null;
  return (
    <Link href={`/generate?model=${m.slug}`} className="flex items-center gap-3 border border-line p-2 transition-colors hover:bg-hover">
      <img src={m.poster} alt="" className="h-10 w-16 shrink-0 bg-black object-cover" />
      <div className="min-w-0">
        <p className="truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg">{m.name}</p>
        <p className="truncate text-xs text-dim">{m.tagline}</p>
      </div>
    </Link>
  );
}

export function DashboardOG({ name, favs, recents, models }: DashData) {
  return (
    <div className="relative flex min-h-screen flex-col bg-base">
      <SiteHeader />
      <main className="relative z-10 w-full flex-1 px-10 py-8">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Dashboard</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Let&apos;s create something, {name}</h1>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Getting started</h2>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-dim">1 of 4 done</span>
        </div>
        <div className="mt-3 grid grid-cols-2 border-b border-r border-line sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <Link key={s.title} href={s.href} className="group border-l border-t border-line p-4 transition-colors hover:bg-hover">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${s.done ? "bg-accent text-ink" : "border border-line-strong font-[family-name:var(--font-jetbrains)] text-muted"}`}>{s.done ? "✓" : i + 1}</span>
              <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg transition-colors group-hover:text-gold-soft">{s.title}</p>
              <p className="mt-1 text-xs text-dim">{s.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 border-b border-r border-line">
              {LINKS.map((l) => (
                <Link key={l.title} href={l.href} className="group border-l border-t border-line p-5 transition-colors hover:bg-hover">
                  <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] text-fg transition-colors group-hover:text-gold-soft">{l.title}</p>
                  <p className="mt-2 text-sm text-muted">{l.desc}</p>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Snapshot</h2>
            <div className="mt-3 grid grid-cols-2 border-b border-r border-line">
              {SNAPSHOT(models).map(([t, v]) => (
                <div key={t} className="border-l border-t border-line p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-muted">{t}</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="models" className="mt-8 scroll-mt-24 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Recently used</h2>
            {recents.length === 0 ? <p className="mt-3 border border-line p-4 text-sm text-dim">Models you generate with show up here.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2">{recents.map((s) => <OGChip key={s} slug={s} />)}</div>}
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Favorite models</h2>
            {favs.length === 0 ? <p className="mt-3 border border-line p-4 text-sm text-dim">Heart a model in the catalog to save it here.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2">{favs.map((s) => <OGChip key={s} slug={s} />)}</div>}
          </div>
        </div>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}

/* ------------------------------------------------------------- EDITORIAL ---- */
function EdChip({ slug }: { slug: string }) {
  const m = getModel(slug);
  if (!m) return null;
  return (
    <Link href={`/generate?model=${m.slug}`} className="group overflow-hidden rounded-2xl bg-surface shadow-lg transition-transform hover:-translate-y-1">
      <img src={m.poster} alt="" className="aspect-[16/9] w-full bg-black object-cover" />
      <div className="p-3">
        <p className="font-semibold text-fg-strong">{m.name}</p>
        <p className="text-xs text-muted">{m.tagline}</p>
      </div>
    </Link>
  );
}

export function DashboardEditorial({ name, favs, recents, models }: DashData) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-12">
        {/* Big warm greeting */}
        <p className="text-sm uppercase tracking-[0.16em] text-accent-ink">Your studio</p>
        <h1 className="mt-2 text-[clamp(34px,5vw,56px)] font-semibold leading-tight tracking-[-0.02em] text-fg-strong">Let&apos;s create something, {name}.</h1>

        {/* Getting started, horizontal progress of rounded pill cards */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fg-strong">Getting started</h2>
            <span className="text-sm text-muted">1 of 4 done</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Link key={s.title} href={s.href} className="rounded-2xl bg-surface p-5 shadow-lg transition-transform hover:-translate-y-1">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${s.done ? "bg-accent text-ink" : "border border-line-strong text-muted"}`}>{s.done ? "✓" : i + 1}</span>
                <p className="mt-3 font-semibold text-fg-strong">{s.title}</p>
                <p className="mt-1 text-sm font-light text-muted">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Snapshot as soft stat tiles */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SNAPSHOT(models).map(([t, v]) => (
            <div key={t} className="rounded-2xl bg-surface p-6 text-center shadow-lg">
              <p className="text-3xl font-semibold text-fg-strong">{v}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted">{t}</p>
            </div>
          ))}
        </div>

        {/* Quick actions, big rounded cards */}
        <h2 className="mt-12 text-lg font-semibold text-fg-strong">Quick actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((l) => (
            <Link key={l.title} href={l.href} className="rounded-2xl bg-surface p-6 shadow-lg transition-transform hover:-translate-y-1">
              <p className="font-semibold text-fg-strong">{l.title}</p>
              <p className="mt-2 text-sm font-light text-muted">{l.desc}</p>
              <span className="mt-4 inline-block border-b-2 border-accent pb-0.5 text-sm font-medium text-fg">Open →</span>
            </Link>
          ))}
        </div>

        {/* Models as warm rounded cards */}
        <div id="models" className="mt-12 scroll-mt-24 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-fg-strong">Recently used</h2>
            {recents.length === 0 ? <p className="mt-4 rounded-2xl bg-surface p-6 text-sm font-light text-muted shadow-lg">Models you generate with show up here.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{recents.map((s) => <EdChip key={s} slug={s} />)}</div>}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-fg-strong">Favorite models</h2>
            {favs.length === 0 ? <p className="mt-4 rounded-2xl bg-surface p-6 text-sm font-light text-muted shadow-lg">Heart a model in the catalog to save it here.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{favs.map((s) => <EdChip key={s} slug={s} />)}</div>}
          </div>
        </div>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}

/* ------------------------------------------------------------ EXPEDITION ---- */
function XpRow({ slug, index }: { slug: string; index: number }) {
  const m = getModel(slug);
  if (!m) return null;
  return (
    <Link href={`/generate?model=${m.slug}`} className="group flex items-center gap-5 border-t border-line py-4 last:border-b hover:bg-hover">
      <b className="min-w-[44px] text-2xl text-accent-ink">{String(index + 1).padStart(2, "0")}</b>
      <img src={m.poster} alt="" className="h-11 w-[70px] shrink-0 bg-black object-cover" />
      <div className="min-w-0 flex-1">
        <span className="block text-lg text-fg-strong">{m.name}</span>
        <span className="text-sm text-muted">{m.tagline}</span>
      </div>
      <span className="text-accent-ink transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}

export function DashboardLuxury({ name, favs, recents, models }: DashData) {
  return (
    <div className="relative flex min-h-screen flex-col bg-base">
      <SiteHeader />
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-8 py-12">
        <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Your studio</p>
        <h1 className="mt-3 text-[clamp(34px,5vw,56px)] leading-tight text-fg-strong">Welcome back, {name}.</h1>

        {/* Getting started, refined checklist + overview card */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.24em] text-dim">Getting started</h2>
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-dim">1 / 4</span>
            </div>
            <div className="mt-4">
              {STEPS.map((s, i) => (
                <Link key={s.title} href={s.href} className="group flex items-center gap-4 border-t border-line py-4 last:border-b hover:bg-hover">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${s.done ? "bg-accent text-ink" : "border border-line-strong text-muted"}`}>{s.done ? "✓" : i + 1}</span>
                  <div className="flex-1">
                    <span className="block text-lg text-fg-strong">{s.title}</span>
                    <span className="text-sm text-muted">{s.desc}</span>
                  </div>
                  <span className="text-accent-ink">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Overview, dark semi-transparent stat card */}
          <div className="rounded-[16px] border border-hairline bg-surface/70 p-6 backdrop-blur">
            <h2 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.24em] text-dim">Overview</h2>
            <div className="mt-3 divide-y divide-line">
              {SNAPSHOT(models).map(([t, v]) => (
                <div key={t} className="flex items-baseline justify-between py-3">
                  <span className="text-sm text-muted">{t}</span>
                  <span className="font-[family-name:var(--font-playfair)] text-2xl text-fg-strong">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions, thin-underline links */}
        <h2 className="mt-12 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.24em] text-dim">Quick actions</h2>
        <div className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link key={l.title} href={l.href} className="group flex items-center justify-between border-t border-line py-4 hover:bg-hover">
              <div>
                <span className="block text-lg text-fg-strong">{l.title}</span>
                <span className="text-sm text-muted">{l.desc}</span>
              </div>
              <span className="text-accent-ink transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>

        {/* Models as refined rows */}
        <div id="models" className="mt-12 scroll-mt-24 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.24em] text-dim">Recently used</h2>
            {recents.length === 0 ? <p className="mt-4 rounded-[16px] border border-hairline bg-surface/70 p-4 text-sm text-muted backdrop-blur">Models you generate with show up here.</p> : <div className="mt-2">{recents.map((s, i) => <XpRow key={s} slug={s} index={i} />)}</div>}
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.24em] text-dim">Favorite models</h2>
            {favs.length === 0 ? <p className="mt-4 rounded-[16px] border border-hairline bg-surface/70 p-4 text-sm text-muted backdrop-blur">Heart a model in the catalog to save it here.</p> : <div className="mt-2">{favs.map((s, i) => <XpRow key={s} slug={s} index={i} />)}</div>}
          </div>
        </div>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}

/* --------------------------------------------------------------- PLAYFUL ---- */
const PLAY_PASTELS = ["#fff2c2", "#d9ecff", "#ffd9ec", "#d9f5e6", "#e9ddff", "#ffe3d1"];

function PlayChip({ slug, i }: { slug: string; i: number }) {
  const m = getModel(slug);
  if (!m) return null;
  return (
    <Link href={`/generate?model=${m.slug}`} className="group overflow-hidden rounded-[22px] transition-transform hover:-translate-y-1" style={{ background: PLAY_PASTELS[i % PLAY_PASTELS.length], color: "#1a1440" }}>
      <img src={m.poster} alt="" className="aspect-[16/9] w-full object-cover" />
      <div className="p-4">
        <p className="text-lg font-bold">{m.name}</p>
        <p className="text-sm" style={{ color: "#4a4570" }}>{m.tagline}</p>
      </div>
    </Link>
  );
}

export function DashboardPlayful({ name, favs, recents, models }: DashData) {
  return (
    <div className="relative flex min-h-screen flex-col bg-base">
      <SiteHeader />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-12">
        <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-ink">Your studio</span>
        <h1 className="mt-4 text-[clamp(34px,5vw,56px)] font-bold leading-tight text-fg-strong">Hey {name}, let&apos;s make something.</h1>

        {/* Getting started, pastel cards */}
        <h2 className="mt-10 text-lg font-bold text-fg-strong">Getting started</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Link key={s.title} href={s.href} className="rounded-[22px] p-5 transition-transform hover:-translate-y-1" style={{ background: PLAY_PASTELS[i % PLAY_PASTELS.length], color: "#1a1440" }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-lg font-bold" style={{ color: "#7c3aed" }}>{s.done ? "✓" : i + 1}</span>
              <p className="mt-3 font-bold">{s.title}</p>
              <p className="mt-1 text-sm" style={{ color: "#4a4570" }}>{s.desc}</p>
            </Link>
          ))}
        </div>

        {/* Snapshot, pastel stat tiles */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SNAPSHOT(models).map(([t, v], i) => (
            <div key={t} className="rounded-[22px] p-6 text-center" style={{ background: PLAY_PASTELS[(i + 2) % PLAY_PASTELS.length], color: "#1a1440" }}>
              <p className="text-3xl font-bold">{v}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: "#4a4570" }}>{t}</p>
            </div>
          ))}
        </div>

        {/* Quick actions, pastel cards */}
        <h2 className="mt-12 text-lg font-bold text-fg-strong">Quick actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((l, i) => (
            <Link key={l.title} href={l.href} className="rounded-[22px] bg-surface p-6 shadow-lg transition-transform hover:-translate-y-1">
              <p className="font-bold text-fg-strong">{l.title}</p>
              <p className="mt-2 text-sm text-muted">{l.desc}</p>
              <span className="mt-4 inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-ink">Open →</span>
            </Link>
          ))}
        </div>

        {/* Models */}
        <div id="models" className="mt-12 scroll-mt-24 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold text-fg-strong">Recently used</h2>
            {recents.length === 0 ? <p className="mt-4 rounded-[22px] bg-surface p-6 text-sm text-muted shadow-lg">Models you generate with show up here.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{recents.map((s, i) => <PlayChip key={s} slug={s} i={i} />)}</div>}
          </div>
          <div>
            <h2 className="text-lg font-bold text-fg-strong">Favorite models</h2>
            {favs.length === 0 ? <p className="mt-4 rounded-[22px] bg-surface p-6 text-sm text-muted shadow-lg">Heart a model in the catalog to save it here.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{favs.map((s, i) => <PlayChip key={s} slug={s} i={i} />)}</div>}
          </div>
        </div>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}
