import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { ModelPricingTable } from "@/components/model-pricing-table";

export const metadata = { title: "Pricing · Fluxion AI Video" };

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    credits: "100 credits / month",
    features: ["480p output", "Watermarked", "1 model", "Community support"],
    cta: "Get started",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$24",
    period: "/mo",
    credits: "2,000 credits / month",
    features: ["Up to 1080p", "No watermark", "All models", "Priority queue"],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$96",
    period: "/mo",
    credits: "10,000 credits / month",
    features: ["Up to 1080p", "Team seats", "All models", "Email support"],
    cta: "Choose Studio",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
          Pricing
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
          Plans and credits
        </h1>
        <span className="mx-auto mt-3 block h-px w-10 bg-[#E0A24E]" />
        <p className="mx-auto mt-4 max-w-xl text-[#9FB2CC]">
          Credits are spent per second of generated video. Pick a plan and start generating.
        </p>

        {/* animated dots run left->right in the bands around the plans */}
        <div className="relative mt-10 py-24">
        <PlansDots className="pointer-events-none absolute left-1/2 top-0 h-full w-screen -translate-x-1/2" />
        {/* hairline-divided grid (solid bg so dots never show through the boxes) */}
        <div className="relative grid overflow-hidden rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#070D1A] sm:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.id}
              id={p.id}
              className={`scroll-mt-24 border-[rgba(124,189,242,0.14)] p-8 ${
                i > 0 ? "border-t sm:border-l sm:border-t-0" : ""
              } ${p.highlight ? "bg-[rgba(124,189,242,0.05)]" : ""}`}
            >
              <div className="flex items-center justify-center gap-2">
                <h2 className="font-[family-name:var(--font-jetbrains)] text-xl font-medium uppercase tracking-[0.02em]">{p.name}</h2>
                {p.highlight && (
                  <span className="rounded-full bg-[#E0A24E] px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] font-medium uppercase tracking-[0.08em] text-[#0A1322]">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-[#6E82A0]">{p.period}</span>
              </div>
              <p className="mt-1 text-sm text-[#A9BBD4]">{p.credits}</p>
              <ul className="mt-6 space-y-2 text-sm text-[#A9BBD4]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center justify-center gap-2">
                    <span className="text-[#E0A24E]">•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-[10px] px-4 py-2.5 text-center font-medium transition-colors ${
                  p.highlight
                    ? "bg-[#FF8A1E] text-[#0A1322] hover:bg-[#FF9F45]"
                    : "border border-[rgba(124,189,242,0.24)] text-[#E9F1FB] hover:bg-[rgba(124,189,242,0.06)]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        </div>

        {/* Per-model pricing */}
        <div className="mt-20">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">
            Per-model pricing
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#9FB2CC]">
            Credits are spent per second. The dollar column assumes 1 credit ≈ $0.01.
          </p>
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <ModelPricingTable />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
