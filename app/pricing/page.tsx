"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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

function Shell({ children, variant = "a" }: { children: React.ReactNode; variant?: "a" | "b" | "c" }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlowBlobs variant={variant} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant={variant} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

export default function PricingPage() {
  const skin = useSkin();

  // ===== EDITORIAL, centered, airy, editorial statement. =====
  if (skin === "editorial") {
    return (
      <Shell variant="a">
        <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.16em] text-accent-ink">Pricing</p>
          <h1 className="mt-4 text-[clamp(40px,7vw,80px)] font-semibold leading-[0.98] tracking-[-0.02em] text-fg-strong">
            <span className="text-accent-ink">{PAYG.price}</span><br />per second.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg font-light text-muted">No subscriptions. Pay only for the video you make, every model, up to 1080p, watermark-free.</p>
          <div className="mx-auto mt-10 max-w-2xl bg-surface p-8 text-left shadow-lg">
            <h2 className="text-xl font-semibold text-fg-strong">Estimate a clip</h2>
            <div className="mt-5"><CostEstimator bare /></div>
          </div>
          <div className="mx-auto mt-12 max-w-2xl text-left">
            <h2 className="text-2xl font-semibold text-fg-strong">Per-model rates</h2>
            <div className="mt-5"><ModelPricingTable /></div>
          </div>
        </main>
      </Shell>
    );
  }

  // ===== LUXURY, immersive dark, gold, generous margins. =====
  if (skin === "luxury") {
    return (
      <Shell variant="a">
        <main className="w-full flex-1">
          <section className="mx-auto max-w-5xl px-8 pb-10 pt-20 text-center">
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Investment</p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-[clamp(40px,7vw,84px)] leading-[1] text-fg-strong">Pay as you go</h1>
            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="font-[family-name:var(--font-playfair)] text-5xl text-accent-ink">{PAYG.price}</span>
              <span className="text-muted">{PAYG.note}</span>
            </div>
            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-fg-soft">
              {PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-accent-ink">◆</span>{f}</li>)}
            </ul>
            <Link href={PAYG.href} className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-medium text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
          </section>
          <section className="mx-auto grid max-w-5xl gap-6 px-8 py-10 lg:grid-cols-2">
            <div className="rounded-[16px] border border-hairline bg-surface/70 p-7 backdrop-blur">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-fg-strong">Estimate a commission</h2>
              <div className="mt-5"><CostEstimator bare /></div>
            </div>
            <div className="rounded-[16px] border border-hairline bg-surface/70 p-7 backdrop-blur">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-fg-strong">Per-model rates</h2>
              <div className="mt-5"><ModelPricingTable /></div>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  // ===== PLAYFUL, chunky pastel cards. =====
  if (skin === "playful") {
    return (
      <Shell variant="a">
        <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-16">
          <h1 className="text-center text-[clamp(36px,6vw,68px)] font-extrabold text-fg-strong">Pricing made simple</h1>
          <p className="mt-3 text-center text-lg text-muted">No subscriptions, just pay per second.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[24px] p-8" style={{ background: "#fff2c2", color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" }}>
              <p className="text-5xl font-extrabold">{PAYG.price}<span className="text-lg font-bold"> {PAYG.note}</span></p>
              <ul className="mt-5 space-y-2 text-sm font-medium" style={{ color: "#4a4570" }}>
                {PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span style={{ color: "#7c3aed" }}>●</span>{f}</li>)}
              </ul>
              <Link href={PAYG.href} className="mt-6 inline-block rounded-full bg-accent px-7 py-3 font-semibold text-ink" style={{ boxShadow: "5px 5px 0 rgba(26,20,64,0.18)" }}>{PAYG.cta} →</Link>
            </div>
            <div className="rounded-[24px] bg-surface p-8" style={{ boxShadow: "6px 6px 0 rgba(26,20,64,0.12)" }}>
              <h2 className="text-2xl font-extrabold text-fg-strong">Estimate a clip</h2>
              <div className="mt-5"><CostEstimator bare /></div>
            </div>
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-extrabold text-fg-strong">Per-model rates</h2>
            <div className="mt-6"><ModelPricingTable /></div>
          </div>
        </main>
      </Shell>
    );
  }

  // ===== OG, the original layout. =====
  return (
    <Shell variant="a">
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
          <div className="border-t border-hairline-strong p-6 lg:border-l lg:border-t-0">
            <CostEstimator bare />
          </div>
        </div>
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Per-model rates</h2>
          <p className="mt-1 text-sm text-muted">Credits are spent per second. The dollar column assumes 1 credit ≈ $0.01.</p>
          <div className="mt-4"><ModelPricingTable /></div>
        </div>
      </main>
    </Shell>
  );
}
