"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { CostEstimator } from "@/components/cost-estimator";
import { getModels, type Model } from "@/lib/models";
import { useSkin } from "@/lib/use-skin";

const PAYG = {
  price: "from $0.03",
  note: "/ second",
  features: ["Only pay for what you generate", "All models, up to 1080p", "No watermark", "Volume discounts"],
  cta: "Get credits",
  href: "/profile",
};
const price = (c: number) => (c * 5 * 0.01).toFixed(2);

// Fixed-height shell for the alt skins: fills the viewport, no footer, no scroll.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-start overflow-hidden px-8 pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function RatesList({ models, big = false }: { models: Model[]; big?: boolean }) {
  return (
    <div className="divide-y divide-line">
      {models.map((m) => (
        <div key={m.slug} className="flex items-baseline justify-between py-2.5">
          <div><p className="text-sm font-medium text-fg-strong">{m.name}</p><p className="text-xs text-muted">up to {m.resolutions[m.resolutions.length - 1]}</p></div>
          <div className="text-right"><p className={`font-[family-name:var(--font-jetbrains)] ${big ? "text-xl" : "text-lg"} text-accent-ink`}>${price(m.creditsPerSecond)}</p><p className="text-[10px] uppercase tracking-[0.06em] text-dim">/ 5s clip</p></div>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const skin = useSkin();
  const models = getModels();

  // ===== EDITORIAL: asymmetric statement (big price left, glass card right). =====
  if (skin === "editorial") {
    return (
      <Shell>
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-accent-ink">Pricing</p>
            <h1 className="mt-3 text-[clamp(40px,6vw,76px)] font-semibold leading-[0.95] tracking-[-0.02em] text-fg-strong"><span className="text-accent-ink">{PAYG.price}</span><br />per second.</h1>
            <ul className="mt-5 space-y-1.5 text-sm font-light text-muted">{PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-accent-ink">·</span>{f}</li>)}</ul>
            <Link href={PAYG.href} className="mt-6 inline-block bg-accent px-6 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
          </div>
          <div className="rounded-[18px] bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-fg-strong">Estimate a clip</h2>
            <div className="mt-3"><CostEstimator bare /></div>
            <div className="mt-4 border-t border-line pt-3"><RatesList models={models} /></div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== LUXURY: centered serif hero, then two sharp shaded panels. =====
  if (skin === "luxury") {
    return (
      <Shell>
        <div className="text-center">
          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Investment</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(34px,5vw,60px)] leading-[1] text-fg-strong">Pay as you go</h1>
          <p className="mt-2 text-muted"><span className="text-accent-ink">{PAYG.price}</span> {PAYG.note} · no subscriptions · up to 1080p</p>
          <Link href={PAYG.href} className="mt-4 inline-block bg-accent px-8 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="border border-hairline bg-panel p-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">Estimate a commission</h2>
            <div className="mt-3"><CostEstimator bare /></div>
          </div>
          <div className="border border-hairline bg-panel p-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">Per-model rates</h2>
            <div className="mt-3"><RatesList models={models} /></div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== PLAYFUL: a tall yellow rate card + two stacked pastel cards. =====
  if (skin === "playful") {
    return (
      <Shell>
        <h1 className="text-center text-[clamp(30px,4.5vw,52px)] font-extrabold text-fg-strong">Pricing made simple</h1>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col justify-center rounded-[24px] p-8" style={{ background: "#fff2c2", color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" }}>
            <p className="text-6xl font-extrabold">{PAYG.price}<span className="text-xl font-bold"> {PAYG.note}</span></p>
            <ul className="mt-5 space-y-2 text-sm font-semibold" style={{ color: "#4a4570" }}>{PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span style={{ color: "#7c3aed" }}>●</span>{f}</li>)}</ul>
            <Link href={PAYG.href} className="mt-6 inline-block self-start rounded-full bg-accent px-7 py-3 font-semibold text-ink" style={{ boxShadow: "5px 5px 0 rgba(26,20,64,0.18)" }}>{PAYG.cta} →</Link>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-[22px] bg-surface p-5" style={{ boxShadow: "6px 6px 0 rgba(26,20,64,0.12)" }}>
              <h2 className="text-lg font-extrabold text-fg-strong">Estimate a clip</h2>
              <div className="mt-2"><CostEstimator bare /></div>
            </div>
            <div className="rounded-[22px] bg-surface p-5" style={{ boxShadow: "6px 6px 0 rgba(26,20,64,0.12)" }}>
              <h2 className="text-lg font-extrabold text-fg-strong">Per-model rates</h2>
              <div className="mt-2"><RatesList models={models} /></div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== SLIDESHOW: a horizontal strip of price cards + an estimator beside. =====
  if (skin === "cosmos") {
    return (
      <Shell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Pricing</p>
            <h1 className="mt-1 font-[family-name:var(--font-space)] text-[clamp(28px,4vw,48px)] font-semibold text-fg-strong">Pay as you go</h1>
          </div>
          <p className="text-sm text-fg-soft">{PAYG.price} {PAYG.note} · no subscriptions</p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
            {models.map((m) => (
              <div key={m.slug} style={{ scrollSnapAlign: "start" }} className="w-[190px] shrink-0 rounded-[14px] border border-hairline bg-surface p-5">
                <p className="font-[family-name:var(--font-space)] font-semibold text-fg-strong">{m.name}</p>
                <p className="mt-3 text-3xl font-semibold text-accent-ink">${price(m.creditsPerSecond)}</p>
                <p className="text-xs text-muted">per 5s · {m.creditsPerSecond} cr/s</p>
                <p className="mt-2 text-xs text-fg-soft">up to {m.resolutions[m.resolutions.length - 1]}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[14px] border border-hairline bg-surface p-5">
            <h2 className="font-[family-name:var(--font-space)] text-lg font-semibold text-fg-strong">Estimate a clip</h2>
            <div className="mt-3"><CostEstimator bare /></div>
            <Link href={PAYG.href} className="mt-4 inline-block rounded-[8px] bg-accent px-6 py-2.5 font-semibold text-ink">{PAYG.cta}</Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== OG: the ORIGINAL pricing page, untouched. =====
  return (
    <div className="flex min-h-screen flex-col">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-10 py-8">
        <div>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Pricing</span>
          <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Pay as you go</h1>
          <p className="mt-2 text-sm text-muted">No subscriptions. You only pay per second of video you generate, priced per model.</p>
        </div>
        <div className="mt-6 grid border border-line bg-surface/50 backdrop-blur-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center p-6">
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-accent-ink">{PAYG.price}</span>
              <span className="text-sm text-dim">{PAYG.note}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-fg-soft-2">
              {PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-gold">•</span>{f}</li>)}
            </ul>
            <Link href={PAYG.href} className="mt-5 inline-block self-start bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
          </div>
          <div className="border-t border-hairline-strong p-6 lg:border-l lg:border-t-0"><CostEstimator bare /></div>
        </div>
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Per-model rates</h2>
          <p className="mt-1 text-sm text-muted">Credits are spent per second. The dollar column assumes 1 credit ≈ $0.01.</p>
          <div className="mt-4"><ModelPricingTable /></div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
