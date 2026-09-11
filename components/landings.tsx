"use client";

/* ============================================================================
   Skin-specific LANDING layouts. Same content + links + functionality, but a
   genuinely different structure/arrangement per skin (not just recolored):
     - LandingOG          the original layout (hero reels, marquee, sections)
     - LandingEditorial   frosted-glass, zigzag editorial rhythm, model grid
     - LandingExpedition  full-bleed cinematic hero, brush edges, numbered routes
   app/page.tsx picks one via useSkin(). Shared chrome (header/footer) is reused.
   ============================================================================ */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelMarquee } from "@/components/model-marquee";
import { ModelCard } from "@/components/model-card";
import { Reveal } from "@/components/reveal";
import { HeroReels } from "@/components/hero-reels";
import { Stats } from "@/components/stats";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { GlowBlobs } from "@/components/glow-blobs";
import { PlansDots } from "@/components/plans-dots";
import { getModels, type Model } from "@/lib/models";
import { isFavorite, toggleFavorite, isAutoplay } from "@/lib/prefs";

const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";

/* Shared fixed background — auto-switches via decor classes + tokens per skin. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <img src={`${BASE}/backdrop.svg`} alt="" className="decor-dark h-full w-full object-cover" decoding="async" />
      <div className="decor-light absolute inset-0">
        <GlowBlobs variant="a" className="absolute inset-0 h-full w-full" />
        <PlansDots variant="a" className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

function Kicker({ label, color = "var(--c-gold)" }: { label: string; color?: string }) {
  return (
    <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em]" style={{ color }}>
      {label}
    </span>
  );
}

function SectionHeading({ index, label, title, color = "var(--c-gold)", center = false }: { index: string; label: string; title: string; color?: string; center?: boolean }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className={`pointer-events-none absolute -top-12 select-none font-[family-name:var(--font-jetbrains)] text-8xl font-bold leading-none text-fg-strong/[0.05] ${center ? "left-1/2 -translate-x-1/2" : "-left-1"}`}>
        {index}
      </span>
      <div className="relative">
        <Kicker label={label} color={color} />
        <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">{title}</h2>
        <span className={`mt-3 block h-px w-10 ${center ? "mx-auto" : ""}`} style={{ background: color }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- OG ---- */
export function LandingOG() {
  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />

      <section className="relative overflow-hidden lg:h-[68vh]">
        <div className="relative z-10 grid h-full items-center gap-10 px-10 py-20 sm:px-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-0">
          <div className="max-w-xl lg:pl-12">
            <p className="mb-6 font-[family-name:var(--font-sora)] text-6xl font-medium leading-none tracking-[-0.03em] text-fg-strong sm:text-7xl lg:text-8xl">fluxion</p>
            <h1 className="mt-6 font-[family-name:var(--font-jetbrains)] text-4xl font-semibold leading-[1.05] tracking-[-0.01em] text-fg-strong sm:text-5xl">Your words,<br />in motion.</h1>
            <p className="mt-6 max-w-md text-lg text-muted">Pick a model, write a prompt, and watch your idea become video in seconds.</p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link href="/signup" className="w-full rounded-none bg-accent px-6 py-3 text-center font-[family-name:var(--font-jetbrains)] font-medium uppercase tracking-[0.04em] text-ink transition-colors hover:bg-accent-hover sm:w-auto">Get started</Link>
              <a href="#models" className="w-full rounded-none border border-hairline-strong px-6 py-3 text-center font-[family-name:var(--font-jetbrains)] font-medium uppercase tracking-[0.04em] text-fg transition-colors hover:bg-raised sm:w-auto">Explore models</a>
            </div>
          </div>
          <div className="hidden justify-self-end lg:block"><HeroReels /></div>
        </div>
      </section>

      <Stats />

      <section id="models" className="scroll-mt-24 pb-20 pt-14">
        <Reveal className="px-10">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading index="01" label="Models" title="Explore our models" />
            <Link href="/models" className="hidden shrink-0 text-sm text-muted transition-colors hover:text-gold-soft sm:block">View all</Link>
          </div>
        </Reveal>
        <div className="mt-10"><ModelMarquee /></div>
      </section>

      <section className="px-10 py-20">
        <Reveal className="mx-auto max-w-4xl text-center">
          <SectionHeading index="02" label="Walkthrough" title="See it in action" color="var(--c-blue)" center />
          <p className="mx-auto mt-4 max-w-xl text-muted">Watch a prompt become a finished video in under a minute.</p>
          <div className="mt-8 mx-auto max-w-4xl overflow-hidden rounded-[10px] bg-black">
            <video className="aspect-video w-full object-cover" src={`${BASE}/demos/walkthrough.mp4`} controls preload="metadata" playsInline />
          </div>
        </Reveal>
      </section>

      <section className="px-10 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="text-center">
            <SectionHeading index="03" label="Pricing" title="Pay as you go" color="var(--c-gold-bright)" center />
            <p className="mx-auto mt-4 max-w-xl text-muted">No subscriptions. Pay per second of video, priced per model.</p>
          </div>
          <div className="mt-8"><ModelPricingTable /></div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="rounded-none border border-hairline-strong px-6 py-3 font-[family-name:var(--font-jetbrains)] font-medium uppercase tracking-[0.04em] text-fg transition-colors hover:bg-raised">See full pricing</Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}

/* An Instagram-style "post" card for a model: avatar + handle header, square
   media that plays on hover, a like/comment/share action row (the like heart is
   wired to the real favorites store), likes count, and a caption with hashtags. */
function IgPost({ model }: { model: Model }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fav, setFav] = useState(false);
  const [hover, setHover] = useState(false);
  useEffect(() => setFav(isFavorite(model.slug)), [model.slug]);

  // Deterministic "likes" so it's stable across SSR/hydration.
  const likes = 800 + ([...model.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 900) * 3;
  const handle = model.name.toLowerCase();
  const tags = model.capabilities.map((c) => "#" + c.replace(/[^a-z0-9]+/gi, "").toLowerCase());

  function play() {
    if (isAutoplay()) { setHover(true); videoRef.current?.play().catch(() => {}); }
  }
  function stop() {
    setHover(false);
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }

  return (
    <article className="overflow-hidden rounded-[18px] bg-surface shadow-lg">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-ink"
          style={{ background: "linear-gradient(135deg, var(--c-accent-ink), var(--c-gold))" }}
        >
          {model.name[0]}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <Link href={`/generate?model=${model.slug}`} className="block truncate text-sm font-semibold text-fg-strong hover:underline">
            {handle}
          </Link>
          <p className="truncate text-xs text-muted">{model.tagline}</p>
        </div>
        <span className="text-fg-soft" aria-hidden="true">•••</span>
      </div>

      {/* media (square, plays on hover) */}
      <Link
        href={`/generate?model=${model.slug}`}
        onMouseEnter={play}
        onMouseLeave={stop}
        onDoubleClick={(e) => { e.preventDefault(); setFav(toggleFavorite(model.slug)); }}
        className="relative block aspect-square bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={model.poster} alt={model.name} className={`h-full w-full object-cover transition-opacity ${hover ? "opacity-0" : "opacity-100"}`} />
        <video ref={videoRef} src={model.demoVideo} poster={model.poster} muted loop playsInline preload="none" className={`absolute inset-0 h-full w-full object-cover transition-opacity ${hover ? "opacity-100" : "opacity-0"}`} />
      </Link>

      {/* action row */}
      <div className="flex items-center gap-4 px-4 pt-3 text-fg-strong">
        <button
          type="button"
          aria-label={fav ? "Unlike" : "Like"}
          onClick={() => setFav(toggleFavorite(model.slug))}
          className="hit transition-transform active:scale-90"
        >
          <Heart size={22} strokeWidth={1.8} fill={fav ? "var(--c-heart)" : "none"} color={fav ? "var(--c-heart)" : "currentColor"} />
        </button>
        {/* comment */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* share */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="flex-1" />
        {/* bookmark */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* likes + caption */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-sm font-semibold text-fg-strong">{(likes + (fav ? 1 : 0)).toLocaleString()} likes</p>
        <p className="mt-1 text-sm text-fg">
          <span className="font-semibold">{handle}</span> {model.description}
        </p>
        <p className="mt-1 text-sm text-accent-ink">{tags.join(" ")}</p>
        <Link href={`/generate?model=${model.slug}`} className="mt-2 inline-block text-xs uppercase tracking-[0.08em] text-muted hover:text-accent-ink">
          Open in playground →
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------- EDITORIAL ---- */
export function LandingEditorial() {
  const models = getModels();
  const byslug = (s: string) => models.find((m) => m.slug === s) ?? models[0];
  const features = [
    {
      h: "Text to video in seconds",
      b: "Describe a shot and Aurora renders cinematic motion — steady camera moves, coherent scenes, and sound on demand.",
      img: byslug("aurora").poster,
      href: "/generate?model=aurora",
    },
    {
      h: "Animate any still image",
      b: "Bring a photo to life with Volt. Keep your subject, add natural motion, and export a finished clip in one click.",
      img: byslug("volt").poster,
      href: "/generate?model=volt",
    },
    {
      h: "Finish in high resolution",
      b: "Take a draft all the way to a polished 1080p cut with Nova — crisp detail for the shots that matter.",
      img: byslug("nova").poster,
      href: "/generate?model=nova",
    },
  ];
  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />

      {/* Hero: editorial split — statement left, framed preview right. No reels. */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-8 py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Kicker label="AI Video Studio" color="var(--c-accent-ink)" />
          <h1 className="mt-5 text-[clamp(44px,7vw,84px)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg-strong">Your words,<br />in motion.</h1>
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-muted">A boutique studio for motion. Write a line, choose a model, and watch it come together — crisp content over a warm, unhurried canvas.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/signup" className="bg-accent px-7 py-3.5 font-medium text-ink transition-colors hover:bg-accent-hover">Start generating →</Link>
            <Link href="/models" className="border border-hairline-strong px-7 py-3.5 font-medium text-fg transition-colors hover:bg-hover">Browse models</Link>
          </div>
        </div>
        <div className="relative">
          <div className="bg-surface p-3 shadow-lg">
            <ModelCard model={models[0]} />
          </div>
        </div>
      </section>

      {/* Zigzag feature rhythm */}
      <section className="mx-auto max-w-6xl px-8">
        {features.map((f, i) => (
          <div key={i} className={`grid items-center gap-10 py-10 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div className="overflow-hidden bg-surface p-2 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.img} alt={f.h} className="aspect-[16/11] w-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-fg-strong">{f.h}</h2>
              <p className="mt-3 max-w-md font-light leading-relaxed text-muted">{f.b}</p>
              <Link href={f.href} className="mt-5 inline-block border-b-2 border-accent pb-0.5 font-medium text-fg">Try it →</Link>
            </div>
          </div>
        ))}
      </section>

      {/* Model grid (warm, rounded, glassy cards) */}
      <section id="models" className="mx-auto max-w-6xl scroll-mt-24 px-8 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <Kicker label="The menu" color="var(--c-accent-ink)" />
            <h2 className="mt-2 text-3xl font-semibold text-fg-strong">Choose your model</h2>
          </div>
          <Link href="/models" className="text-sm text-muted hover:text-accent-ink">View all →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => <IgPost key={m.slug} model={m} />)}
        </div>
      </section>

      {/* Pricing in a glass card */}
      <section className="mx-auto max-w-5xl px-8 pb-24">
        <div className="bg-surface p-8 shadow-lg">
          <Kicker label="Pricing" color="var(--c-accent-ink)" />
          <h2 className="mt-2 text-3xl font-semibold text-fg-strong">Pay as you go</h2>
          <p className="mt-3 max-w-xl font-light text-muted">No subscriptions. Pay per second of video, priced per model.</p>
          <div className="mt-7"><ModelPricingTable /></div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------ EXPEDITION ---- */
function BrushEdge({ flip = false, fill = "var(--c-base)" }: { flip?: boolean; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" className="block h-[52px] w-full" style={{ transform: flip ? "rotate(180deg)" : undefined, fill }}>
      <path d="M0,40 C120,10 240,55 360,38 C500,18 560,52 700,44 C840,36 900,8 1040,26 C1180,44 1280,20 1440,36 L1440,60 L0,60 Z" />
    </svg>
  );
}

export function LandingExpedition() {
  const models = getModels();
  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />

      {/* Full-bleed cinematic hero with a layered mountain + brush edge. */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          <svg viewBox="0 0 1440 620" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
            <defs>
              <linearGradient id="xpsky2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--c-base)" />
                <stop offset="1" stopColor="var(--c-base-2)" />
              </linearGradient>
            </defs>
            <rect width="1440" height="620" fill="url(#xpsky2)" />
            <polygon points="0,620 300,270 560,620" fill="var(--c-surface)" opacity="0.7" />
            <polygon points="360,620 740,190 1120,620" fill="var(--c-panel)" />
            <polygon points="860,620 1180,300 1440,620" fill="var(--c-surface)" opacity="0.7" />
            <polygon points="740,190 800,250 758,286 826,356 720,344 654,398 606,320" fill="var(--c-fg-strong)" opacity="0.85" />
          </svg>
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-8 pb-32 pt-24">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.28em] text-accent-ink">Est. 2026 — Motion Expeditions</p>
          <h1 className="mt-6 text-[clamp(48px,9vw,110px)] leading-[0.92] text-fg-strong">Into the wild render.</h1>
          <p className="mt-6 max-w-lg text-lg font-light text-fg-soft">Chart a course from prompt to picture. Epic models, honest controls, and a playground built for the long haul.</p>
          <Link href="/signup" className="mt-8 inline-block border-b border-accent pb-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.12em] text-fg-strong transition-colors hover:text-accent-ink">Plan your first generation →</Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10"><BrushEdge /></div>
      </section>

      {/* Numbered "routes" (models) — two-column bold-number list. */}
      <section id="models" className="mx-auto max-w-4xl scroll-mt-24 px-8 py-20">
        <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.28em] text-dim">Destinations</p>
        <h2 className="mt-3 text-4xl text-fg-strong">Choose your route</h2>
        <div className="mt-8">
          {models.map((m, i) => (
            <Link key={m.slug} href={`/generate?model=${m.slug}`} className="group flex items-center gap-6 border-t border-line py-6 transition-colors last:border-b hover:bg-hover">
              <b className="min-w-[56px] text-3xl text-accent-ink">{String(i + 1).padStart(2, "0")}</b>
              <div className="flex-1">
                <span className="block text-xl text-fg-strong">{m.name}</span>
                <span className="text-sm text-muted">{m.tagline}</span>
              </div>
              <span className="text-xl text-accent-ink transition-transform group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing over a dark field, framed by brush edges. */}
      <section className="relative bg-base-2 py-4">
        <BrushEdge flip fill="var(--c-base)" />
        <div className="mx-auto max-w-5xl px-8 py-14">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.28em] text-dim">Provisions</p>
          <h2 className="mt-3 text-4xl text-fg-strong">Pay as you go</h2>
          <p className="mt-4 max-w-xl font-light text-fg-soft">No subscriptions. Pay per second of video, priced per model.</p>
          <div className="mt-8"><ModelPricingTable /></div>
          <Link href="/pricing" className="mt-6 inline-block border-b border-accent pb-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.12em] text-fg-strong hover:text-accent-ink">See full pricing →</Link>
        </div>
        <BrushEdge fill="var(--c-base)" />
      </section>

      <SiteFooter />
    </div>
  );
}
