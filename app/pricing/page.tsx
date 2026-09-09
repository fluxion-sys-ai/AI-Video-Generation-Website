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
  cta: "Add credits",
  href: "/profile",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-10">
        <div className="text-center">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
            Pricing
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
            Pay as you go
          </h1>
          <span className="mx-auto mt-3 block h-px w-10 bg-[#E0A24E]" />
          <p className="mt-4 text-[#9FB2CC]">
            No subscriptions. You only pay per second of video you generate, priced per model.
          </p>
        </div>

        {/* Estimator */}
        <div className="mx-auto mt-8 max-w-3xl">
          <CostEstimator />
        </div>

        {/* Per-model table (the core rate card) */}
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
            Per-model rates
          </h2>
          <p className="mt-2 text-sm text-[#9FB2CC]">
            Credits are spent per second. The dollar column assumes 1 credit ≈ $0.01.
          </p>
          <div className="mt-4">
            <ModelPricingTable />
          </div>
        </div>

        {/* Pay as you go — the only option */}
        <div className="mx-auto mt-12 max-w-md rounded-[14px] border border-[#FF8A1E] bg-[rgba(255,138,30,0.06)] p-6">
          <h3 className="font-[family-name:var(--font-jetbrains)] text-xl font-medium uppercase tracking-[0.02em]">
            {PAYG.name}
          </h3>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-jetbrains)] text-3xl font-semibold">{PAYG.price}</span>
            <span className="text-sm text-[#6E82A0]">{PAYG.note}</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-[#A9BBD4]">
            {PAYG.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-[#E0A24E]">•</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={PAYG.href}
            className="mt-6 block rounded-[10px] bg-[#FF8A1E] px-4 py-2.5 text-center font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]"
          >
            {PAYG.cta}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
