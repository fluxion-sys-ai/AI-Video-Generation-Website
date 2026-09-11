"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { useSkin } from "@/lib/use-skin";

const FEATURES: { icon: React.ReactNode; h: string; b: string }[] = [
  { icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>, h: "Text & image to video", b: "Start from a prompt or animate a still, a model for every kind of shot." },
  { icon: <><path d="M4 7h16M4 12h16M4 17h10" /></>, h: "Real controls", b: "Duration, aspect ratio, resolution, seed and audio: dial in exactly what you need." },
  { icon: <><path d="M12 3v12M8 11l4 4 4-4M4 19h16" /></>, h: "Export & reuse", b: "Download finished MP4s, or push reference images back into a model's playground." },
  { icon: <><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18" /></>, h: "Pay as you go", b: "No subscriptions. Credit-based pricing per second, priced per model." },
];
const STEPS: [string, string, string][] = [
  ["01", "Pick a model", "Browse the catalog and compare capability, resolution, and price."],
  ["02", "Write a prompt", "Describe the shot: subject, motion, camera, lighting, and set your options."],
  ["03", "Generate & refine", "Preview the result, refine it in chat, then download the finished clip."],
];
const FAQ: [string, string][] = [
  ["Is this a real video generator?", "This is a frontend demo. The flows are real, but generation is mocked."],
  ["How is pricing calculated?", "Each model has a credits-per-second rate; the dollar figure assumes 1 credit ≈ $0.01."],
  ["Do I need an account?", "You can browse freely. Generating and saving ask you to sign in first."],
  ["Which formats can I export?", "MP4 today. WebM and GIF are shown as coming-soon options."],
];
const CONTACT = [
  ["Email", "hello@fluxion-sys.ai", "mailto:hello@fluxion-sys.ai"],
  ["Web", "fluxion-sys.ai", "https://fluxion-sys.ai"],
  ["Docs", "API & guides", "/docs"],
];

function FeatIcon({ node }: { node: React.ReactNode }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{node}</svg>;
}

export default function InfoPage() {
  const skin = useSkin();

  const bg = (
    <>
      <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );

  // ===== EDITORIAL, a magazine spread. =====
  if (skin === "editorial") {
    return (
      <div className="relative flex min-h-screen flex-col">{bg}<SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-accent-ink">About</p>
              <h1 className="mt-4 text-[clamp(40px,6vw,76px)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg-strong">A studio for ideas in motion.</h1>
              <p className="mt-6 max-w-md text-lg font-light text-muted">Choose a model, compose a prompt, and generate. Real controls, an iterative playground, and a warm place to work.</p>
              <Link href="/signup" className="mt-8 inline-block bg-accent px-6 py-3 font-medium text-ink transition-colors hover:bg-accent-hover">Get started</Link>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {FEATURES.map((f) => (
                <div key={f.h} className="flex items-start gap-4 py-5">
                  <span className="mt-0.5 text-accent-ink"><FeatIcon node={f.icon} /></span>
                  <div><h2 className="text-lg font-semibold text-fg-strong">{f.h}</h2><p className="mt-1 text-sm font-light text-muted">{f.b}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div><h2 className="text-2xl font-semibold text-fg-strong">Questions</h2>
              <div className="mt-4 divide-y divide-line border-y border-line">{FAQ.map(([q, a]) => <div key={q} className="py-4"><p className="font-semibold text-fg-strong">{q}</p><p className="mt-1 text-sm font-light text-muted">{a}</p></div>)}</div>
            </div>
            <div><h2 className="text-2xl font-semibold text-fg-strong">Say hello</h2>
              <dl className="mt-4 space-y-3 text-sm">{CONTACT.map(([k, v, h]) => <div key={k}><dt className="text-xs uppercase tracking-[0.06em] text-dim">{k}</dt><dd><a href={h} className="text-blue hover:text-accent-ink">{v}</a></dd></div>)}</dl>
            </div>
          </div>
        </main>
        <div className="relative z-10"><SiteFooter /></div>
      </div>
    );
  }

  // ===== LUXURY, centered serif with vertical-rule feature columns. =====
  if (skin === "luxury") {
    return (
      <div className="relative flex min-h-screen flex-col">{bg}<SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-20 text-center">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">About Fluxion</p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-[clamp(36px,6vw,68px)] leading-[1.02] text-fg-strong">Cinematic video, on demand.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-light text-fg-soft">A private studio for turning words into motion, crafted for those who expect a finish worth their name.</p>
          <div className="mt-14 grid grid-cols-2 divide-x divide-hairline lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.h} className="px-6"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-accent-border text-accent-ink"><FeatIcon node={f.icon} /></span>
                <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-lg text-fg-strong">{f.h}</h2>
                <p className="mt-2 text-sm font-light text-muted">{f.b}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-16 max-w-xl">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-fg-strong">Get in touch</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">{CONTACT.map(([k, v, h]) => <a key={k} href={h} className="text-accent-ink hover:text-fg-strong">{k}: {v}</a>)}</div>
          </div>
        </main>
        <div className="relative z-10"><SiteFooter /></div>
      </div>
    );
  }

  // ===== PLAYFUL, colorful pastel cards. =====
  if (skin === "playful") {
    const PASTELS = ["#fff2c2", "#d9ecff", "#ffd9ec", "#d9f5e6"];
    return (
      <div className="relative flex min-h-screen flex-col">{bg}<SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-16">
          <div className="text-center">
            <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-ink">About us</span>
            <h1 className="mt-4 text-[clamp(36px,6vw,68px)] font-extrabold text-fg-strong">Serious tools, made fun.</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">A bright little studio where good ideas turn into motion.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.h} className="rounded-[24px] p-6" style={{ background: PASTELS[i % PASTELS.length], color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.14)" }}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80"><FeatIcon node={f.icon} /></span>
                <h2 className="mt-4 text-lg font-extrabold">{f.h}</h2><p className="mt-1 text-sm" style={{ color: "#4a4570" }}>{f.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div><h2 className="text-2xl font-extrabold text-fg-strong">FAQ</h2>
              <div className="mt-4 space-y-3">{FAQ.map(([q, a], i) => <div key={q} className="rounded-[18px] p-5" style={{ background: PASTELS[(i + 1) % PASTELS.length], color: "#1a1440" }}><p className="font-bold">{q}</p><p className="mt-1 text-sm" style={{ color: "#4a4570" }}>{a}</p></div>)}</div>
            </div>
            <div className="rounded-[22px] bg-surface p-6" style={{ boxShadow: "6px 6px 0 rgba(26,20,64,0.12)" }}>
              <h2 className="text-2xl font-extrabold text-fg-strong">Say hi</h2>
              <dl className="mt-4 space-y-3 text-sm">{CONTACT.map(([k, v, h]) => <div key={k}><dt className="text-xs uppercase tracking-[0.06em] text-dim">{k}</dt><dd><a href={h} className="font-semibold text-accent-ink">{v}</a></dd></div>)}</dl>
            </div>
          </div>
        </main>
        <div className="relative z-10"><SiteFooter /></div>
      </div>
    );
  }

  // ===== SLIDESHOW (cosmos), airy violet, horizontal feature strip. =====
  if (skin === "cosmos") {
    return (
      <div className="relative flex min-h-screen flex-col">{bg}<SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-8 py-16">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">About</p>
          <h1 className="mt-3 text-[clamp(36px,6vw,68px)] font-semibold leading-[1.02] text-fg-strong">Words in, video out.</h1>
          <p className="mt-5 max-w-xl text-lg text-fg-soft">A calm, modern studio for turning prompts into motion.</p>
          <div className="mt-10 flex gap-5 overflow-x-auto pb-3">
            {FEATURES.map((f) => (
              <div key={f.h} className="w-[260px] shrink-0 rounded-[14px] border border-hairline bg-surface p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-accent-border bg-accent-soft text-accent-ink"><FeatIcon node={f.icon} /></span>
                <h2 className="mt-4 text-lg font-semibold text-fg-strong">{f.h}</h2><p className="mt-1 text-sm text-muted">{f.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">{STEPS.map(([n, h, b]) => <div key={n}><span className="text-3xl font-bold text-accent-ink">{n}</span><h3 className="mt-2 text-base font-semibold text-fg-strong">{h}</h3><p className="mt-1 text-sm text-muted">{b}</p></div>)}</div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm">{CONTACT.map(([k, v, h]) => <a key={k} href={h} className="text-accent-ink hover:text-fg-strong">{k}: {v}</a>)}</div>
        </main>
        <div className="relative z-10"><SiteFooter /></div>
      </div>
    );
  }

  // ===== OG, hero + cards + steps + FAQ/contact. =====
  return (
    <div className="relative flex min-h-screen flex-col">{bg}<SiteHeader />
      <main className="relative z-10 w-full flex-1">
        <section className="mx-auto max-w-4xl px-6 pb-10 pt-16 text-center">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">About</span>
          <h1 className="mt-3 text-[clamp(34px,5.5vw,60px)] font-medium leading-[1.02] text-fg-strong">Prompt in, video out.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">Fluxion is a studio for turning words into motion. Choose a model, compose a prompt, and generate.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-none bg-accent px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-ink transition-colors hover:bg-accent-hover">Get started</Link>
            <Link href="/models" className="rounded-none border border-hairline-strong px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-fg transition-colors hover:bg-hover">Explore models</Link>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.h} className="rounded-[10px] border border-line bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-accent-border bg-accent-soft text-accent-ink"><FeatIcon node={f.icon} /></span>
                <h2 className="mt-4 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg-strong">{f.h}</h2>
                <p className="mt-2 text-sm text-muted">{f.b}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
          <div><h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.1em] text-muted">FAQ</h2>
            <div className="mt-4 divide-y divide-line border-y border-line">{FAQ.map(([q, a]) => <div key={q} className="py-4"><p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg-strong">{q}</p><p className="mt-2 text-sm text-muted">{a}</p></div>)}</div>
          </div>
          <div className="h-fit rounded-[10px] border border-line bg-surface p-6"><h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-strong">Get in touch</h2>
            <dl className="mt-5 space-y-3 text-sm">{CONTACT.map(([k, v, h]) => <div key={k}><dt className="text-xs uppercase tracking-[0.06em] text-dim">{k}</dt><dd><a href={h} className="text-blue hover:text-gold-soft">{v}</a></dd></div>)}</dl>
          </div>
        </section>
      </main>
      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}
