import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { CostEstimator } from "@/components/cost-estimator";

export const metadata = { title: "Pricing · Fluxion AI Video" };

const PAYG = {
  name: "Pay as you go",
  price: "from $0.03",
  note: "/ second",
  features: ["Only pay for what you generate", "All models, up to 1080p", "No watermark", "Volume discounts"],
  cta: "Get credits",
  href: "/profile",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-10 py-8">
        {/* Compact header */}
        <div>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">
            Pricing
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
            Pay as you go
          </h1>
          <p className="mt-2 text-sm text-muted">
            No subscriptions. You only pay per second of video you generate, priced per model.
          </p>
        </div>

        {/* Price info + calculator on one line, in a square shaded box split by a thin rule */}
        <div className="mt-6 grid border border-line bg-surface/50 backdrop-blur-sm lg:grid-cols-[0.85fr_1.15fr]">
          {/* left: rate + features + CTA */}
          <div className="flex flex-col justify-center p-6">
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-accent">{PAYG.price}</span>
              <span className="text-sm text-dim">{PAYG.note}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-fg-soft-2">
              {PAYG.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-gold">•</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={PAYG.href}
              className="mt-5 inline-block self-start bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover"
            >
              {PAYG.cta}
            </Link>
          </div>

          {/* thin chic divider + calculator */}
          <div className="border-t border-hairline-strong p-6 lg:border-l lg:border-t-0">
            <CostEstimator bare />
          </div>
        </div>

        {/* Per-model rate table */}
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
            Per-model rates
          </h2>
          <p className="mt-1 text-sm text-muted">
            Credits are spent per second. The dollar column assumes 1 credit ≈ $0.01.
          </p>
          <div className="mt-4">
            <ModelPricingTable />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
