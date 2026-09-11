"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { CostEstimator } from "@/components/cost-estimator";
import { getModels } from "@/lib/models";
import { useSkin } from "@/lib/use-skin";

const PAYG = {
  price: "from $0.03",
  note: "/ second",
  features: ["Only pay for what you generate", "All models, up to 1080p", "No watermark", "Volume discounts"],
  cta: "Get credits",
  href: "/profile",
};
const price = (c: number) => (c * 5 * 0.01).toFixed(2);

// Fixed-height shell: fills the viewport, no footer, nothing scrolls.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-8 py-6">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  const skin = useSkin();
  const models = getModels();

  // Per-skin card + heading looks (the three columns share this styling).
  const card =
    skin === "editorial" ? "rounded-[18px] bg-surface p-6 shadow-lg"
    : skin === "luxury" ? "rounded-[16px] border border-hairline bg-surface/70 p-6 backdrop-blur"
    : skin === "playful" ? "rounded-[22px] bg-surface p-6"
    : skin === "cosmos" ? "rounded-[14px] border border-hairline bg-surface p-6"
    : "border border-line bg-surface/60 p-6";
  const pop = skin === "playful" ? { boxShadow: "6px 6px 0 rgba(26,20,64,0.14)" } : undefined;
  const rateCard =
    skin === "playful"
      ? { className: "rounded-[22px] p-6", style: { background: "#fff2c2", color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" } }
      : { className: card, style: pop };
  const h2 = "font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-muted";
  const bullet = skin === "playful" ? "●" : skin === "luxury" ? "◆" : "•";

  return (
    <Shell>
      {/* Header */}
      <div className={skin === "og" ? "" : "text-center"}>
        <p className={`font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.2em] ${skin === "og" ? "text-gold" : "text-accent-ink"}`}>Pricing</p>
        <h1 className="mt-1 text-[clamp(28px,4vw,48px)] font-semibold leading-tight text-fg-strong">Pay as you go</h1>
      </div>

      {/* One short row: rate · estimator · per-model rates */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Rate + features + CTA */}
        <div className={rateCard.className} style={rateCard.style}>
          <p className="text-4xl font-bold" style={skin === "playful" ? undefined : { color: "var(--c-accent-ink)" }}>{PAYG.price}<span className="text-base font-medium text-muted"> {PAYG.note}</span></p>
          <ul className="mt-4 space-y-1.5 text-sm text-fg-soft" style={skin === "playful" ? { color: "#4a4570" } : undefined}>
            {PAYG.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="text-accent-ink" style={skin === "playful" ? { color: "#7c3aed" } : undefined}>{bullet}</span>{f}</li>)}
          </ul>
          <Link href={PAYG.href} className="mt-5 inline-block rounded-[var(--radius-control)] bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-ink transition-colors hover:bg-accent-hover">{PAYG.cta}</Link>
        </div>

        {/* Estimator */}
        <div className={card} style={pop}>
          <h2 className={h2}>Estimate a clip</h2>
          <div className="mt-3"><CostEstimator bare /></div>
        </div>

        {/* Per-model rates (compact list) */}
        <div className={card} style={pop}>
          <h2 className={h2}>Per-model rates</h2>
          <div className="mt-3 divide-y divide-line">
            {models.map((m) => (
              <div key={m.slug} className="flex items-baseline justify-between py-2.5">
                <div><p className="text-sm font-medium text-fg-strong">{m.name}</p><p className="text-xs text-muted">up to {m.resolutions[m.resolutions.length - 1]}</p></div>
                <div className="text-right"><p className="font-[family-name:var(--font-jetbrains)] text-lg text-accent-ink">${price(m.creditsPerSecond)}</p><p className="text-[10px] uppercase tracking-[0.06em] text-dim">/ 5s clip</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
