"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { isSignedIn, getUser } from "@/lib/auth";
import { getModels, getModel } from "@/lib/models";
import { getFavorites, getRecents } from "@/lib/prefs";

const STEPS = [
  { title: "Create account", desc: "You're signed in and ready.", href: "/profile?tab=account", done: true },
  { title: "Set up billing", desc: "Add a payment method.", href: "/profile?tab=payment", done: false },
  { title: "Get credits", desc: "Top up your balance.", href: "/profile?tab=billing", done: false },
  { title: "Get API key", desc: "Generate video over HTTP.", href: "/docs#keys", done: false },
];

const LINKS = [
  { title: "New generation", desc: "Pick a model and prompt.", href: "/generate", color: "#FF8A1E" },
  { title: "Browse models", desc: "Compare the catalog.", href: "/models", color: "#7CBDF2" },
  { title: "Library", desc: "Your videos and uploads.", href: "/library", color: "#7CBDF2" },
  { title: "Documentation", desc: "Guides and API reference.", href: "/docs", color: "#E0A24E" },
];

function ModelChip({ slug }: { slug: string }) {
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

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/dashboard");
      return;
    }
    setName(getUser()?.name || "Creator");
    setFavs(getFavorites());
    setRecents(getRecents());
    setReady(true);
  }, [router]);

  const models = getModels();

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="relative flex min-h-screen flex-col bg-base">
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-10 py-8">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Dashboard</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
          Let&apos;s create something, {name}
        </h1>

        {/* Getting started */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Getting started</h2>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-dim">1 of 4 done</span>
        </div>
        <div className="mt-3 grid grid-cols-2 border-b border-r border-line sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <Link key={s.title} href={s.href} className="group border-l border-t border-line p-4 transition-colors hover:bg-hover">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  s.done ? "bg-accent text-ink" : "border border-line-strong font-[family-name:var(--font-jetbrains)] text-muted"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg transition-colors group-hover:text-gold-soft">
                {s.title}
              </p>
              <p className="mt-1 text-xs text-dim">{s.desc}</p>
            </Link>
          ))}
        </div>

        {/* Quick links + snapshot */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 border-b border-r border-line">
              {LINKS.map((l) => (
                <Link key={l.title} href={l.href} className="group border-l border-t border-line p-5 transition-colors hover:bg-hover">
                  <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em]" style={{ color: l.color }}>{l.title}</p>
                  <p className="mt-2 text-sm text-muted">{l.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Snapshot</h2>
            <div className="mt-3 grid grid-cols-2 border-b border-r border-line">
              {[
                ["Credit balance", "$0.00"],
                ["Generations", "0"],
                ["This month", "$0.00"],
                ["Saved models", String(models.length)],
              ].map(([t, v]) => (
                <div key={t} className="border-l border-t border-line p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-muted">{t}</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recently used + favorites (My models — linked from the header menu) */}
        <div id="models" className="mt-8 scroll-mt-24 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Recently used</h2>
            {recents.length === 0 ? (
              <p className="mt-3 border border-line p-4 text-sm text-dim">Models you generate with show up here.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {recents.map((s) => <ModelChip key={s} slug={s} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Favorite models</h2>
            {favs.length === 0 ? (
              <p className="mt-3 border border-line p-4 text-sm text-dim">Heart a model in the catalog to save it here.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {favs.map((s) => <ModelChip key={s} slug={s} />)}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
