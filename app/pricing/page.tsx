import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { PlansInteractive } from "@/components/plans-interactive";

export const metadata = { title: "Pricing · Fluxion AI Video" };

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    priceNum: 0,
    credits: "100 credits / month",
    creditsNum: 100,
    features: ["480p output", "Watermarked", "1 model", "Community support"],
    cta: "Get started",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$24",
    period: "/mo",
    priceNum: 24,
    credits: "2,000 credits / month",
    creditsNum: 2000,
    features: ["Up to 1080p", "No watermark", "All models", "Priority queue"],
    cta: "Choose Pro",
    popular: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$96",
    period: "/mo",
    priceNum: 96,
    credits: "10,000 credits / month",
    creditsNum: 10000,
    features: ["Up to 1080p", "Team seats", "All models", "Email support"],
    cta: "Choose Studio",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">
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
          <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
          <PlansDots className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />

          <div className="relative">
            {/* Plans + linked value charts (hover a plan to highlight its bars) */}
            <PlansInteractive plans={PLANS} />

            {/* Per-model table — full width */}
            <div className="mt-10">
              <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
                Per-model pricing
              </h2>
              <div className="mt-3">
                <ModelPricingTable />
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
