"use client";

// Pricing. Every number on this page comes from the backend: the catalogue says
// which models, resolutions and durations exist, and the hub's rate card says
// what a second of each costs. There is nothing here to keep in sync by hand,
// and nothing claimed that the database cannot produce.
//
// Three things are charged, and all three are shown: the video you generate,
// the reference material a generation reads (the provider bills an input clip
// by its own length, and input images past its free allowance), and the storage
// of what you keep, at the bucket's own monthly price.
//
// The earlier version carried a plan card ("all models, up to 1080p", "volume
// discounts"), comparison charts and a credit unit priced at a cent. None of
// that was real, so none of it is here.

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PlansDots } from "@/components/decor/plans-dots";
import { GlowBlobs } from "@/components/decor/glow-blobs";
import { CostEstimator } from "@/components/landing/cost-estimator";
import { getModels, refreshCatalog, type Model } from "@/lib/models";
import { BACKEND_ENABLED, getPlatformRates, type PlatformRates, type ReferenceLimits } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { estimateCost, money, ratesFor, useRateCard, perSecondPrice } from "@/lib/rate-card";

export default function PricingPage() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const { card } = useRateCard();
  const models = getModels().filter((m) => m.available !== false);
  const [platform, setPlatform] = useState<PlatformRates | null>(null);
  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    let alive = true;
    getPlatformRates()
      .then((rates) => alive && setPlatform(rates))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // What the provider charges for material a generation reads. The rates live
  // in the model's catalogue row; the unit price the hub actually bills comes
  // from its rate card, so where both exist they are the same number.
  const inputRate = (m: Model, kind: "video" | "audio" | "image"): string | null => {
    const limits: ReferenceLimits | undefined = m.reference?.[kind];
    if (!limits) return null;
    const tiers = ratesFor(card, m);
    const tier = tiers?.[0];
    if (kind === "video") {
      const perSecond = tier?.unitPrices.input_video_seconds ?? limits.usd_per_second ?? null;
      return perSecond === null ? null : `${money(perSecond)} per second of the clip you supply`;
    }
    if (kind === "image") {
      const each = tier?.unitPrices.input_images_billable ?? limits.usd_each ?? null;
      if (each === null) return null;
      return limits.free_count
        ? `first ${limits.free_count} free, then ${money(each)} each`
        : `${money(each)} each`;
    }
    return "free";
  };

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
          Reference material a generation reads is charged at the provider&apos;s own rate, and what you keep
          in your library is charged by the gigabyte-month at what the storage costs us. No subscription,
          no minimum, and nothing is charged for a generation that fails.
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

                    {/* What this model charges for material it reads. */}
                    {m.reference && (
                      <dl className="mt-4 space-y-2 border-t border-hairline pt-2 text-sm">
                        {(["video", "audio", "image"] as const).map((kind) => {
                          const rate = inputRate(m, kind);
                          if (!rate) return null;
                          const label = kind === "video" ? "Reference video" : kind === "audio" ? "Reference audio" : "Reference images";
                          return (
                            <div key={kind} className="flex flex-wrap items-baseline justify-between gap-3">
                              <dt className="text-fg-soft">{label}</dt>
                              <dd className="text-muted">{rate}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}

                    <p className="mt-3 text-xs text-dim">
                      {m.durations[0]}–{m.durations[m.durations.length - 1]}s · {m.capabilities.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[18px] border border-line bg-surface/70 p-5 backdrop-blur-sm">
              <CostEstimator bare />
              <p className="mt-4 border-t border-hairline pt-3 text-xs text-dim">
                Prices are set in the platform&apos;s own database and can change; the rate shown when
                you submit is the rate you pay.
              </p>
            </div>

            {platform && (
              <div className="rounded-[18px] border border-line bg-surface/70 p-5 backdrop-blur-sm">
                <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Storage</h2>
                <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-accent-ink">
                  {money(platform.storage.usd_per_gb_month)}
                  <span className="ml-2 text-sm font-normal text-muted">per GB per month</span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  Your finished videos and the material you upload stay in cloud storage, charged at what that
                  storage costs us. It is measured through the month and billed for the time it is actually kept,
                  so deleting a file stops its charge. A 50 MB clip kept for a month costs{" "}
                  {money((50 / 1024) * platform.storage.usd_per_gb_month)}.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
