import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { PricingCharts } from "@/components/pricing-charts";

export const metadata = { title: "Pricing · Fluxion AI Video" };

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    credits: "100 credits / month",
    creditsNum: 100,
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
    creditsNum: 2000,
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
    creditsNum: 10000,
    features: ["Up to 1080p", "Team seats", "All models", "Email support"],
    cta: "Choose Studio",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="text-center">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
            Pricing
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
            Plans and credits
          </h1>
          <span className="mx-auto mt-3 block h-px w-10 bg-[#E0A24E]" />
        </div>

        <div className="relative mt-6 py-6">
          <PlansDots className="pointer-events-none absolute left-1/2 top-0 h-full w-screen -translate-x-1/2" />

          <div className="relative">
            {/* Plans — 3 across */}
            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  id={p.id}
                  className={`scroll-mt-24 rounded-[12px] border p-4 ${
                    p.highlight ? "border-[#FF8A1E] bg-[rgba(255,138,30,0.06)]" : "border-[#2E466B] bg-[#0B1524]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
                      {p.name}
                    </h2>
                    {p.highlight && (
                      <span className="rounded-full bg-[#FF8A1E] px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] font-medium uppercase tracking-[0.08em] text-[#0A1322]">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{p.price}</span>
                    <span className="text-xs text-[#6E82A0]">{p.period}</span>
                  </div>
                  <p className="text-xs text-[#9FB2CC]">{p.credits}</p>
                  <ul className="mt-3 space-y-1 text-xs text-[#A9BBD4]">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-[#E0A24E]">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-4 block rounded-[10px] px-4 py-2 text-center text-sm font-medium transition-colors ${
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

            {/* Per-model table + charts side by side */}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
                  Per-model pricing
                </h2>
                <div className="mt-3">
                  <ModelPricingTable />
                </div>
              </div>
              <PricingCharts plans={PLANS} />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
