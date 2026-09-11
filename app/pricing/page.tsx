"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { CostEstimator } from "@/components/cost-estimator";
import { useSkin } from "@/lib/use-skin";

const PAYG = {
  price: "from $0.03",
  note: "/ second",
  features: ["Only pay for what you generate", "All models, up to 1080p", "No watermark", "Volume discounts"],
  cta: "Get credits",
  href: "/profile",
};

// Fixed-height shell: fills the viewport, no footer, nothing scrolls.
function Shell({ children, variant = "a" }: { children: React.ReactNode; variant?: "a" | "b" | "c" }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <GlowBlobs variant={variant} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant={variant} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-8 py-6">
        {children}
      </main>
    </div>
  );
}

export default function PricingPage() {
  const skin = useSkin();
  const feature = (f: string, bullet: string) => (
    <li key={f} className="flex items-center gap-2"><span className="text-accent-ink">{bullet}</span>{f}</li>
  );

  // ===== EDITORIAL, big statement + glass estimator + row rates. =====
  if (skin === "editorial") {
    return (
      <Shell variant="a">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-accent-ink">Pricing</p>
            <h1 className="mt-3 text-[clamp(36px,5vw,64px)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg-strong"><span className="text-accent-ink">{PAYG.price}</span> per second.</h1>
            <p className="mt-4 max-w-md font-light text-muted">No subscriptions. Pay only for the video you make.</p>
            <ul className="mt-4 space-y-1.5 text-sm text-fg-soft">{PAYG.features.map((f) => feature(f, "·"))}</ul>
            <Link href={PAYG.href} className="mt-6 inline-block bg-accent px-6 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
          </div>
          <div className="rounded-[18px] bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-fg-strong">Estimate a clip</h2>
            <div className="mt-3"><CostEstimator bare /></div>
            <div className="mt-5 border-t border-line pt-4"><ModelPricingTable /></div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== LUXURY, serif + gold, two glass panels. =====
  if (skin === "luxury") {
    return (
      <Shell variant="a">
        <div className="mx-auto w-full max-w-6xl">
          <div className="text-center">
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Investment</p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(34px,5vw,60px)] leading-[1] text-fg-strong">Pay as you go</h1>
            <p className="mt-2 text-muted"><span className="text-accent-ink">{PAYG.price}</span> {PAYG.note} · no subscriptions · up to 1080p</p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[16px] border border-hairline bg-surface/70 p-6 backdrop-blur">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">Estimate a commission</h2>
              <div className="mt-3"><CostEstimator bare /></div>
              <Link href={PAYG.href} className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
            </div>
            <div className="rounded-[16px] border border-hairline bg-surface/70 p-6 backdrop-blur">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">Per-model rates</h2>
              <div className="mt-3"><ModelPricingTable /></div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== PLAYFUL, pastel cards. =====
  if (skin === "playful") {
    return (
      <Shell variant="a">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-center text-[clamp(30px,4.5vw,52px)] font-extrabold text-fg-strong">Pricing made simple</h1>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[22px] p-6" style={{ background: "#fff2c2", color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" }}>
              <p className="text-4xl font-extrabold">{PAYG.price}<span className="text-base font-bold"> {PAYG.note}</span></p>
              <ul className="mt-4 space-y-1.5 text-sm font-medium" style={{ color: "#4a4570" }}>{PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span style={{ color: "#7c3aed" }}>●</span>{f}</li>)}</ul>
              <Link href={PAYG.href} className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-semibold text-ink" style={{ boxShadow: "5px 5px 0 rgba(26,20,64,0.18)" }}>{PAYG.cta} →</Link>
            </div>
            <div className="rounded-[22px] bg-surface p-6" style={{ boxShadow: "6px 6px 0 rgba(26,20,64,0.12)" }}>
              <h2 className="text-xl font-extrabold text-fg-strong">Estimate a clip</h2>
              <div className="mt-3"><CostEstimator bare /></div>
            </div>
          </div>
          <div className="mt-5"><ModelPricingTable /></div>
        </div>
      </Shell>
    );
  }

  // ===== SLIDESHOW, a horizontal strip of price cards + estimator. =====
  if (skin === "cosmos") {
    return (
      <Shell variant="a">
        <div className="mx-auto w-full max-w-6xl">
          <div className="text-center">
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Pricing</p>
            <h1 className="mt-2 text-[clamp(32px,5vw,56px)] font-semibold text-fg-strong">Pay as you go</h1>
            <p className="mt-2 text-fg-soft"><span className="text-accent-ink">{PAYG.price}</span> {PAYG.note} · no subscriptions</p>
          </div>
          <div className="mt-8"><ModelPricingTable /></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-soft">
              {PAYG.features.map((f) => <span key={f} className="flex items-center gap-2"><span className="text-accent-ink">•</span>{f}</span>)}
            </div>
            <div className="rounded-[14px] border border-hairline bg-surface p-6">
              <h2 className="text-lg font-semibold text-fg-strong">Estimate a clip</h2>
              <div className="mt-3"><CostEstimator bare /></div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ===== OG. =====
  return (
    <Shell variant="a">
      <div className="mx-auto w-full max-w-6xl">
        <div>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Pricing</span>
          <h1 className="mt-1 text-3xl font-medium uppercase tracking-[0.01em] text-fg-strong">Pay as you go</h1>
        </div>
        <div className="mt-4 grid border border-line bg-surface/50 backdrop-blur-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center p-6">
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-accent-ink">{PAYG.price}</span>
              <span className="text-sm text-dim">{PAYG.note}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-fg-soft-2">{PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-gold">•</span>{f}</li>)}</ul>
            <Link href={PAYG.href} className="mt-5 inline-block self-start bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
          </div>
          <div className="border-t border-hairline-strong p-6 lg:border-l lg:border-t-0"><CostEstimator bare /></div>
        </div>
        <div className="mt-5"><ModelPricingTable /></div>
      </div>
    </Shell>
  );
}
