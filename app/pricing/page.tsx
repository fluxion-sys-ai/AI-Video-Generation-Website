import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
      <main className="mx-auto max-w-6xl px-6 py-16">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
          Pricing
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
          Plans and credits
        </h1>
        <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />
        <p className="mt-4 max-w-xl text-[#9FB2CC]">
          Credits are spent per second of generated video. Pick a plan and start generating.
        </p>

        {/* hairline-divided grid */}
        <div className="mt-10 grid overflow-hidden rounded-[10px] border border-[rgba(124,189,242,0.14)] sm:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.id}
              id={p.id}
              className={`scroll-mt-24 border-[rgba(124,189,242,0.14)] p-8 ${
                i > 0 ? "border-t sm:border-l sm:border-t-0" : ""
              } ${p.highlight ? "bg-[rgba(124,189,242,0.05)]" : ""}`}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-[family-name:var(--font-jetbrains)] text-xl font-medium uppercase tracking-[0.02em]">{p.name}</h2>
                {p.highlight && (
                  <span className="rounded-full border border-[rgba(124,189,242,0.3)] px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.08em] text-[#7CBDF2]">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-[#6E82A0]">{p.period}</span>
              </div>
              <p className="mt-1 text-sm text-[#A9BBD4]">{p.credits}</p>
              <ul className="mt-6 space-y-2 text-sm text-[#A9BBD4]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#E0A24E]">•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block rounded-[10px] px-4 py-2.5 text-center font-medium transition-colors ${
                  p.highlight
                    ? "bg-[#7CBDF2] text-[#0A1322] hover:bg-[#A6D4F8]"
                    : "border border-[rgba(124,189,242,0.24)] text-[#E9F1FB] hover:bg-[rgba(124,189,242,0.06)]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6E82A0]">Frontend demo. No payment is processed.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
