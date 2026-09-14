"use client";

// Pricing. Every number on this page comes from the backend: the catalogue says
// which models, resolutions and durations exist, and the hub's rate card says
// what a second of each costs. There is nothing here to keep in sync by hand,
// and nothing claimed that the database cannot produce.
//
// The earlier version carried a plan card ("all models, up to 1080p", "volume
// discounts"), comparison charts and a credit unit priced at a cent. None of
// that was real, so none of it is here.

import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PlansDots } from "@/components/decor/plans-dots";
import { GlowBlobs } from "@/components/decor/glow-blobs";
import { CostEstimator } from "@/components/landing/cost-estimator";
import { getModels, refreshCatalog, type Model } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { estimateCost, money, ratesFor, useRateCard, perSecondPrice } from "@/lib/rate-card";

export default function PricingPage() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const { card } = useRateCard();
  const models = getModels().filter((m) => m.available !== false);

  const rate = (m: Model, resolution: string): number | null => {
    const tiers = ratesFor(card, m);
    const live = tiers ? perSecondPrice(tiers, { resolution }) : null;
    return live !== null ? live : m.usdPerSecond || null;
  };
  const clip = (m: Model, resolution: string, seconds: number): number | null => {
    const tiers = ratesFor(card, m);
    const live = tiers ? estimateCost(tiers, { seconds, resolution, input_video_seconds: 0 }) : null;
    if (live !== null) return live;
    const perSecond = rate(m, resolution);
    return perSecond === null ? null : perSecond * seconds;
  };
  // The headline figure: the cheapest second anyone can buy right now.
  const cheapest = models
    .flatMap((m) => m.resolutions.map((r) => rate(m, r)))
    .filter((v): v is number => v !== null && v > 0)
    .sort((a, b) => a - b)[0];

  return (
    <div className="flex min-h-screen flex-col">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-10 py-12">
        <h1 className="text-[clamp(30px,4.5vw,52px)] font-extrabold text-fg-strong">Pricing made simple</h1>
        <p className="mt-3 max-w-2xl text-fg-soft">
          You pay per second of video you generate, at the rate for the model and resolution you pick.
          No subscription, no minimum, and nothing is charged for a generation that fails.
        </p>
        {cheapest !== undefined && (
          <p className="mt-6 font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-accent-ink">
            from {money(cheapest)}
            <span className="ml-2 text-base font-normal text-muted">per second</span>
          </p>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <h2 className="text-lg font-extrabold text-fg-strong">Per-model rates</h2>
            {models.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Loading the catalogue…</p>
            ) : (
              <div className="mt-4 space-y-4">
                {models.map((m) => (
                  <div key={m.slug} className="rounded-[18px] border border-line bg-surface/70 p-5 backdrop-blur-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold text-fg-strong">{m.name}</p>
                        <p className="text-sm text-muted">{m.tagline}</p>
                      </div>
                      <Link
                        href={`/generate?model=${m.slug}`}
                        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent-hover"
                      >
                        Generate
                      </Link>
                    </div>

                    <dl className="mt-4 space-y-2 text-sm">
                      {m.resolutions.map((r) => {
                        const perSecond = rate(m, r);
                        return (
                          <div key={r} className="flex items-baseline justify-between gap-3 border-t border-hairline pt-2">
                            <dt className="text-fg-soft">{r}</dt>
                            <dd className="font-[family-name:var(--font-jetbrains)] text-accent-ink">
                              {perSecond === null ? "—" : `${money(perSecond)} / second`}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>

                    {/* Example clips at the durations this model actually offers. */}
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-hairline pt-3 text-sm text-muted">
                      {m.durations.slice(0, 4).map((seconds) => {
                        const resolution = m.popularResolutions[0] || m.resolutions[0];
                        const cost = clip(m, resolution, seconds);
                        return (
                          <span key={seconds}>
                            {seconds}s <span className="text-fg-soft">{cost === null ? "—" : money(cost)}</span>
                          </span>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs text-dim">
                      {m.durations[0]}–{m.durations[m.durations.length - 1]}s · {m.capabilities.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-line bg-surface/70 p-5 backdrop-blur-sm">
            <CostEstimator bare />
            <p className="mt-4 border-t border-hairline pt-3 text-xs text-dim">
              Prices are set in the platform&apos;s own database and can change; the rate shown when
              you submit is the rate you pay.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
