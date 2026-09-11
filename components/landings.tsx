"use client";

/* ============================================================================
   Skin-specific LANDING layouts. Same content + links + functionality, but a
   genuinely different structure/arrangement per skin (not just recolored):
     - LandingOG          the original layout (hero reels, marquee, sections)
     - LandingEditorial   frosted-glass, zigzag editorial rhythm, model grid
     - LandingLuxury      twilight-skyline hero, wave dividers, navy/gold, cream beat
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

/* Shared fixed background, auto-switches via decor classes + tokens per skin. */
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
      b: "Describe a shot and Aurora renders cinematic motion, steady camera moves, coherent scenes, and sound on demand.",
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
      b: "Take a draft all the way to a polished 1080p cut with Nova, crisp detail for the shots that matter.",
      img: byslug("nova").poster,
      href: "/generate?model=nova",
    },
  ];
  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />

      {/* Hero: editorial split, statement left, framed preview right. No reels. */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-8 py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Kicker label="AI Video Studio" color="var(--c-accent-ink)" />
          <h1 className="mt-5 text-[clamp(44px,7vw,84px)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg-strong">Your words,<br />in motion.</h1>
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-muted">A boutique studio for motion. Write a line, choose a model, and watch it come together, crisp content over a warm, unhurried canvas.</p>
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

/* ---------------------------------------------------------------- LUXURY ---- */
// Smooth wave-shaped section divider (the luxury signature, organic, upscale).
export function WaveEdge({ flip = false, fill = "var(--c-base)", className = "" }: { flip?: boolean; fill?: string; className?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" className={`block h-[70px] w-full ${className}`} style={{ transform: flip ? "rotate(180deg)" : undefined, fill }}>
      <path d="M0,48 C240,96 480,96 720,60 C960,24 1200,24 1440,60 L1440,90 L0,90 Z" />
    </svg>
  );
}

// Champagne-gold pill button.
function GoldPill({ href, children, ghost = false }: { href: string; children: React.ReactNode; ghost?: boolean }) {
  return (
    <Link href={href} className={`inline-block rounded-full px-7 py-3 font-medium tracking-[0.02em] transition-colors ${ghost ? "border border-accent-border text-accent-ink hover:bg-accent-soft" : "bg-accent text-ink hover:bg-accent-hover"}`}>
      {children}
    </Link>
  );
}

export function LandingLuxury() {
  const models = getModels();
  return (
    <div className="min-h-screen bg-base">
      <Backdrop />
      <SiteHeader />

      {/* Immersive cinematic hero, a horizontal model clip plays behind the copy. */}
      <section className="relative overflow-hidden">
        <video
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          src={models[3]?.demoVideo ?? models[0].demoVideo}
          poster={models[3]?.poster ?? models[0].poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* navy → gold wash so the copy stays legible over the footage */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,16,36,0.82) 0%, rgba(10,16,36,0.55) 45%, rgba(10,16,36,0.85) 100%)" }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(10,16,36,0.9) 0%, transparent 65%)" }} />
        <div className="relative z-10 mx-auto max-w-5xl px-8 pb-40 pt-32">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Fluxion · Private Studio</p>
          <h1 className="mt-6 max-w-3xl text-[clamp(44px,8vw,96px)] leading-[0.98] text-fg-strong">Your words, in motion.</h1>
          <p className="mt-6 max-w-lg text-lg font-light text-fg-soft">An address for ambitious ideas. Choose a model, compose your prompt, and commission cinematic video with the polish of a five-star production.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <GoldPill href="/signup">Begin your commission →</GoldPill>
            <GoldPill href="/models" ghost>View the collection</GoldPill>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10"><WaveEdge /></div>
      </section>

      {/* Trust stats, borderless columns spread wide, split by thin vertical rules. */}
      <section className="mx-auto max-w-7xl px-10 py-16">
        <div className="grid grid-cols-2 divide-x divide-hairline sm:grid-cols-4">
          {[
            ["4K", "Cinematic models"],
            ["60s", "Prompt to picture"],
            ["1080p", "Finishing quality"],
            ["0", "Subscriptions"],
          ].map(([big, label]) => (
            <div key={label} className="px-6 text-center">
              <p className="font-[family-name:var(--font-playfair)] text-[clamp(36px,5vw,56px)] leading-none text-fg-strong">{big}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statement section over a second cinematic clip. */}
      <div className="relative">
        <WaveEdge flip fill="var(--c-base)" />
        <section className="relative overflow-hidden">
          <video
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            src={models[1]?.demoVideo ?? models[0].demoVideo}
            poster={models[1]?.poster ?? models[0].poster}
            autoPlay muted loop playsInline preload="auto"
          />
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,16,36,0.82), rgba(10,16,36,0.7))" }} />
          <div className="relative z-10 mx-auto max-w-4xl px-8 py-24 text-center">
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">The Fluxion standard</p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-[clamp(28px,4vw,48px)] text-fg-strong">Crafted for those who expect more.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-light text-fg-soft">
              Every model in the collection is selected for its motion, coherence, and finish. No noise, no filler, only the tools worth putting your name on.
            </p>
          </div>
        </section>
        <WaveEdge fill="var(--c-base)" />
      </div>

      {/* The collection (models), organic soft-clipped photo cards. */}
      <section id="models" className="mx-auto max-w-6xl scroll-mt-24 px-8 py-16">
        <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">The collection</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(28px,4vw,44px)] text-fg-strong">Choose your model</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <Link key={m.slug} href={`/generate?model=${m.slug}`} className="group overflow-hidden rounded-[20px] border border-hairline bg-surface/70 backdrop-blur transition-transform hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.poster} alt={m.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs text-accent-ink backdrop-blur">{m.creditsPerSecond} cr/s</span>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">{m.name}</h3>
                  <span className="text-xs uppercase tracking-[0.08em] text-accent-ink">{m.tagline}</span>
                </div>
                <p className="mt-2 text-sm font-light text-muted">{m.description}</p>
                <span className="mt-4 inline-block text-xs uppercase tracking-[0.1em] text-accent-ink transition-transform group-hover:translate-x-1">Enquire →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing over an immersive dark field, framed by waves. */}
      <div className="relative bg-base-2">
        <WaveEdge flip fill="var(--c-base)" />
        <section className="mx-auto max-w-5xl px-8 py-16">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Investment</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(28px,4vw,44px)] text-fg-strong">Pay as you go</h2>
          <p className="mt-4 max-w-xl font-light text-fg-soft">No subscriptions. Commission by the second, priced per model.</p>
          <div className="mt-8"><ModelPricingTable /></div>
          <div className="mt-7"><GoldPill href="/pricing" ghost>See full pricing →</GoldPill></div>
        </section>
        <WaveEdge fill="var(--c-base)" />
      </div>

      <SiteFooter />
    </div>
  );
}

/* --------------------------------------------------------------- PLAYFUL ---- */
const PASTELS = ["#d9f5e6", "#e9ddff", "#ffe3d1", "#d9ecff", "#fff2c2", "#ffd9ec"];
// Minimal line-icon paths (24x24, stroke), no emoji.
const SVC_ICONS: Record<string, React.ReactNode> = {
  text: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M4 18l5-5 4 4 3-3 4 4" /></>,
  refine: <><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="7" cy="17" r="2" /></>,
  export: <><path d="M12 3v12M8 11l4 4 4-4M4 19h16" /></>,
  sound: <><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M17 8a5 5 0 0 1 0 8" /></>,
  gem: <><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18" /></>,
};
const SERVICES = [
  { icon: "text", bg: "#fff2c2", h: "Text to video", b: "Describe a scene and watch it render in seconds." },
  { icon: "image", bg: "#d9ecff", h: "Image to video", b: "Bring a still to life with natural motion." },
  { icon: "refine", bg: "#ffd9ec", h: "Refine & remix", b: "Iterate with a friendly chat until it's just right." },
  { icon: "export", bg: "#d9f5e6", h: "Export anywhere", b: "Download MP4s ready to post and share." },
  { icon: "sound", bg: "#e9ddff", h: "Sound on demand", b: "Add coherent audio to supported models." },
  { icon: "gem", bg: "#ffe3d1", h: "Pay as you go", b: "No subscriptions, only pay for what you make." },
];

// Little twinkling sparkle.
function Sparkle({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={`glitter ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c1.2 6.5 4.5 9.8 12 12-7.5 2.2-10.8 5.5-12 12-1.2-6.5-4.5-9.8-12-12C7.5 9.8 10.8 6.5 12 0Z" />
    </svg>
  );
}

// Chunky cartoon "sticker" shadow used across the Playful landing.
const POP = "6px 6px 0 rgba(26,20,64,0.16)";

// Layered wave divider with a soft cast-shadow above it (adds depth).
function PlayWave({ flip = false, fill = "var(--c-base-2)" }: { flip?: boolean; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" className="-mb-px block h-[74px] w-full" style={{ transform: flip ? "rotate(180deg)" : undefined, fill, filter: "drop-shadow(0 -6px 8px rgba(124,58,237,0.14))" }}>
      <path d="M0,48 C240,96 480,96 720,60 C960,24 1200,24 1440,60 L1440,90 L0,90 Z" />
    </svg>
  );
}

// A rounded pastel block that peeks in from a page edge (asymmetric decor).
function EdgeBlock({ style }: { style: React.CSSProperties }) {
  return <div aria-hidden="true" className="pointer-events-none absolute rounded-[28px]" style={{ boxShadow: POP, ...style }} />;
}

export function LandingPlayful() {
  const models = getModels();
  return (
    <div className="min-h-screen overflow-x-clip bg-base">
      <Backdrop />
      <SiteHeader />

      {/* Hero: bold rounded headline + floating pastel blocks & glitter. */}
      <section className="relative overflow-hidden px-8 pb-10 pt-16">
        {/* asymmetric blocks peeking from the edges */}
        <EdgeBlock style={{ left: -70, top: 40, width: 150, height: 150, rotate: "-10deg", background: "linear-gradient(135deg,#ffe3d1,#ffd9ec)" }} />
        <EdgeBlock style={{ right: -80, bottom: -30, width: 190, height: 130, rotate: "8deg", background: "linear-gradient(135deg,#d9ecff,#e9ddff)" }} />
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative">
            <Sparkle className="absolute -left-4 -top-6 text-accent" size={22} />
            <span className="inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-ink" style={{ boxShadow: POP }}>Fluxion Studio</span>
            <h1 className="mt-5 text-[clamp(42px,7vw,84px)] font-extrabold leading-[0.98] text-fg-strong">
              Bright ideas, <span className="text-accent-ink">set in motion</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">Prompt it, play with it, ship it. A bright little studio where good ideas turn into motion.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-accent px-7 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5" style={{ boxShadow: POP }}>Start creating →</Link>
              <Link href="/models" className="rounded-full border-2 border-accent-border px-7 py-3.5 font-semibold text-accent-ink transition-colors hover:bg-accent-soft">See models</Link>
            </div>
          </div>
          {/* Flat-illustration stand-in: asymmetric pastel blocks w/ depth */}
          <div className="relative hidden h-[340px] lg:block">
            <div className="absolute left-4 top-2 h-40 w-56 rotate-[-6deg] rounded-[28px]" style={{ background: "linear-gradient(135deg,#ffe3d1,#ffd9ec)", boxShadow: POP }} />
            <div className="absolute right-2 top-16 h-48 w-48 rotate-[8deg] rounded-[28px]" style={{ background: "linear-gradient(135deg,#d9ecff,#e9ddff)", boxShadow: POP }} />
            <div className="absolute bottom-2 left-16 h-36 w-52 rotate-[3deg] rounded-[28px]" style={{ background: "linear-gradient(135deg,#d9f5e6,#fff2c2)", boxShadow: POP }} />
            <Sparkle className="absolute right-8 top-6 text-accent" size={26} />
            <Sparkle className="absolute bottom-8 left-6 text-accent-ink" size={18} />
          </div>
        </div>
      </section>

      <PlayWave fill="var(--c-base-2)" />

      {/* Services, 3-col pastel sticker cards over a faint pixel grid. */}
      <section className="relative overflow-hidden bg-base-2 px-8 py-16">
        <div className="play-pixels pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <EdgeBlock style={{ right: -60, top: 30, width: 140, height: 140, rotate: "12deg", background: "linear-gradient(135deg,#fff2c2,#d9f5e6)" }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold text-fg-strong">What you can make</h2>
            <Sparkle className="text-accent" size={20} />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <div key={s.h} className="rounded-[24px] p-6" style={{ background: s.bg, color: "#1a1440", boxShadow: POP, transform: `rotate(${(i % 3) - 1 ? (i % 2 ? "0.6deg" : "-0.6deg") : "0deg"})` }}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80" style={{ boxShadow: "3px 3px 0 rgba(26,20,64,0.14)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{SVC_ICONS[s.icon]}</svg>
                </span>
                <h3 className="mt-4 text-xl font-extrabold">{s.h}</h3>
                <p className="mt-1 text-sm" style={{ color: "#4a4570" }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PlayWave flip fill="var(--c-base-2)" />

      {/* Models, asymmetric bento of colorful sticker cards. */}
      <section id="models" className="relative scroll-mt-24 overflow-hidden px-8 py-16">
        <EdgeBlock style={{ left: -70, bottom: 40, width: 160, height: 120, rotate: "-8deg", background: "linear-gradient(135deg,#e9ddff,#d9ecff)" }} />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold text-fg-strong">Meet the models</h2>
          <div className="mt-8 grid auto-rows-[210px] grid-cols-2 gap-6 lg:grid-cols-4">
            {models.map((m, i) => (
              <Link
                key={m.slug}
                href={`/generate?model=${m.slug}`}
                className={`group relative overflow-hidden rounded-[24px] p-5 transition-transform hover:-translate-y-1 ${i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2" : ""}`}
                style={{ background: PASTELS[i % PASTELS.length], color: "#1a1440", boxShadow: POP }}
              >
                <img src={m.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-luminosity transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${PASTELS[i % PASTELS.length]}cc)` }} />
                <div className="relative flex h-full flex-col justify-end">
                  <h3 className="text-2xl font-extrabold">{m.name}</h3>
                  <p className="text-sm" style={{ color: "#4a4570" }}>{m.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PlayWave fill="var(--c-base-2)" />

      {/* Pricing on a pastel field. */}
      <section className="relative overflow-hidden bg-base-2 px-8 py-16">
        <div className="play-pixels pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl rounded-[28px] bg-surface p-8" style={{ boxShadow: POP }}>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold text-fg-strong">Pricing made simple</h2>
            <Sparkle className="text-accent" size={20} />
          </div>
          <p className="mt-3 text-muted">No subscriptions, pay per second of video, priced per model.</p>
          <div className="mt-7"><ModelPricingTable /></div>
          <div className="mt-6"><Link href="/pricing" className="inline-block rounded-full bg-accent px-7 py-3.5 font-semibold text-ink transition-transform hover:-translate-y-0.5" style={{ boxShadow: POP }}>See full pricing →</Link></div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------- COSMOS ---- */
// A sideways-scrolling "slideshow" landing. Full-viewport panels laid out
// horizontally with scroll-snap; the wheel is mapped to horizontal motion so a
// mouse can drive it too. The starfield backdrop (CosmosBackdrop) sits behind.
export function LandingCosmos() {
  const models = getModels();
  const deck = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = deck.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal
      e.preventDefault();
      el!.scrollLeft += e.deltaY;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const panel = "relative z-10 flex h-full w-screen shrink-0 flex-col justify-center px-[8vw]";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base text-fg">
      <SiteHeader />
      <div ref={deck} className="cosmos-deck flex flex-1 overflow-x-auto overflow-y-hidden">
      <div className="relative flex h-full">
        {/* Continuous pattern + ribbon that run across every panel as you scroll. */}
        <div className="cosmos-pattern" />
        <div className="cosmos-ribbon" style={{ width: "300vw" }} />
        {/* Panel 1: hero */}
        <section className={panel}>
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.4em] text-accent-ink">Fluxion Studio</p>
          <h1 className="mt-6 max-w-3xl text-[clamp(44px,8vw,104px)] font-semibold leading-[0.95] text-fg-strong">From prompt to picture.</h1>
          <p className="mt-6 max-w-md text-lg text-fg-soft">Pick a model, write a prompt, and generate. One idea per slide, told left to right.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/signup" className="rounded-[8px] bg-accent px-7 py-3.5 font-semibold text-ink shadow-[0_0_30px_-6px_var(--c-accent)] transition-transform hover:-translate-y-0.5">Start generating →</Link>
            <Link href="/models" className="rounded-[8px] border border-accent-border px-7 py-3.5 font-semibold text-accent-ink transition-colors hover:bg-accent-soft">Browse models</Link>
          </div>
          <p className="mt-12 flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.2em] text-dim">Scroll sideways <span className="text-accent-ink">→</span></p>
        </section>

        {/* Panel 2: models */}
        <section className={panel}>
          <h2 className="font-[family-name:var(--font-space)] text-[clamp(26px,4vw,44px)] text-fg-strong">The models</h2>
          <div className="mt-8 flex gap-6 overflow-visible">
            {models.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} className="group w-[240px] shrink-0 overflow-hidden rounded-[12px] border border-hairline bg-surface transition-transform hover:-translate-y-1">
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img src={m.poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] text-accent-ink backdrop-blur">0{i + 1}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-space)] text-base text-fg-strong">{m.name}</h3>
                  <p className="mt-1 text-xs text-muted">{m.tagline}</p>
                  <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-xs text-accent-ink">{m.creditsPerSecond} cr/s →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Panel 3: pricing + CTA */}
        <section className={panel}>
          <h2 className="font-[family-name:var(--font-space)] text-[clamp(26px,4vw,44px)] text-fg-strong">Pay as you go</h2>
          <p className="mt-4 max-w-md text-fg-soft">No subscriptions. Pay per second, priced per model.</p>
          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {models.map((m) => (
              <div key={m.slug} className="rounded-[12px] border border-hairline bg-surface p-5">
                <p className="font-[family-name:var(--font-space)] text-sm text-fg-strong">{m.name}</p>
                <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl text-accent-ink">${(m.creditsPerSecond * 5 * 0.01).toFixed(2)}</p>
                <p className="text-xs text-muted">/ 5s clip</p>
              </div>
            ))}
          </div>
          <div className="mt-9">
            <Link href="/signup" className="rounded-[8px] bg-accent px-8 py-3.5 font-semibold text-ink shadow-[0_0_30px_-6px_var(--c-accent)] transition-transform hover:-translate-y-0.5">Start generating →</Link>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
