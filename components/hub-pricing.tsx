"use client";

// Pricing widgets that read the live rate card from the model hub's database
// (GET /api/pricing), used when the site runs with NEXT_PUBLIC_BACKEND=1.

import { useEffect, useState } from "react";
import { getModels } from "@/lib/models";
import { getPricing } from "@/lib/api";
import { estimateCost, parseTaskTiers, perSecondPrice, type ParsedTaskTier } from "@/lib/pricing-expr";

type RateCard = Record<string, ParsedTaskTier[]>;

let cached: Promise<RateCard> | null = null;

function loadRateCard(): Promise<RateCard> {
  if (!cached) {
    cached = getPricing()
      .then((items) => {
        const card: RateCard = {};
        for (const item of items) {
          if (item.billing_mode !== "tiered_expr" || !item.billing_expr) continue;
          const tiers = parseTaskTiers(item.billing_expr, item.billing_usage_schema);
          if (tiers.length) card[item.model_name] = tiers;
        }
        return card;
      })
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

function useRateCard(): { card: RateCard | null; failed: boolean } {
  const [state, setState] = useState<{ card: RateCard | null; failed: boolean }>({ card: null, failed: false });
  useEffect(() => {
    let alive = true;
    loadRateCard()
      .then((card) => {
        if (alive) setState({ card, failed: false });
      })
      .catch(() => {
        if (alive) setState({ card: null, failed: true });
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Dollars with cents, keeping a third decimal only when a rate needs it ($0.045). */
export function money(n: number): string {
  const cents = n.toFixed(2);
  return Math.abs(Number(cents) - n) < 1e-9 ? `$${cents}` : `$${n.toFixed(3)}`;
}

function rateRange(tiers: ParsedTaskTier[] | undefined, resolutions: string[]): string {
  if (!tiers) return "—";
  const rates = resolutions.map((r) => perSecondPrice(tiers, { resolution: r })).filter((v): v is number => v !== null);
  if (!rates.length) return "—";
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  return lo === hi ? money(lo) : `${money(lo)}–${money(hi)}`;
}

/** Lowest per-second price across the catalog, e.g. "from $0.03". */
export function HubFromPrice({ fallback }: { fallback: string }) {
  const { card } = useRateCard();
  if (!card) return <>{fallback}</>;
  const rates = getModels().flatMap((m) =>
    m.resolutions.map((r) => (card[m.slug] ? perSecondPrice(card[m.slug], { resolution: r }) : null)).filter((v): v is number => v !== null),
  );
  return <>{rates.length ? `from ${money(Math.min(...rates))}` : fallback}</>;
}

export function HubModelPricingTable() {
  const { card, failed } = useRateCard();
  const models = getModels();
  return (
    <div className="overflow-x-auto border border-line-strong bg-surface/70 backdrop-blur-sm">
      <table className="w-full min-w-[560px] table-fixed text-left text-base">
        <thead className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">
          <tr className="border-b border-line-strong">
            <th className="px-5 py-3.5">Model</th>
            <th className="px-5 py-3.5">Best for</th>
            <th className="px-5 py-3.5">Max res</th>
            <th className="px-5 py-3.5 text-right">$ / sec</th>
            <th className="px-5 py-3.5 text-right">5s clip</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const tiers = card?.[m.slug];
            const res = m.popularResolutions[0] || m.resolutions[0];
            const clip = tiers ? estimateCost(tiers, { seconds: 5, resolution: res, input_video_seconds: 0 }) : null;
            return (
              <tr key={m.slug} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.02em] text-fg-strong">{m.name}</td>
                <td className="px-5 py-3.5 text-muted">{m.tagline}</td>
                <td className="px-5 py-3.5 text-muted">{m.resolutions[m.resolutions.length - 1]}</td>
                <td className="px-5 py-3.5 text-right font-[family-name:var(--font-jetbrains)] text-lg text-gold-bright">
                  {card ? rateRange(tiers, m.resolutions) : failed ? "—" : "…"}
                </td>
                <td className="px-5 py-3.5 text-right text-fg-strong">
                  {clip !== null ? `${money(clip)} at ${res}` : card || failed ? "—" : "…"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const sel =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue";

export function HubCostEstimator({ bare = false }: { bare?: boolean }) {
  const { card, failed } = useRateCard();
  const models = getModels();
  const [slug, setSlug] = useState(models[0].slug);
  const model = models.find((m) => m.slug === slug) || models[0];
  const [duration, setDuration] = useState(model.durations[0]);
  const [resolution, setResolution] = useState(model.popularResolutions[0] || model.resolutions[0]);

  function chooseModel(next: string) {
    const m = models.find((x) => x.slug === next) || models[0];
    setSlug(m.slug);
    setDuration(m.durations[0]);
    setResolution(m.popularResolutions[0] || m.resolutions[0]);
  }

  const tiers = card?.[model.slug];
  const cost = tiers ? estimateCost(tiers, { seconds: duration, resolution, input_video_seconds: 0 }) : null;

  return (
    <div className={bare ? "" : "border border-line bg-surface/70 p-6 backdrop-blur-sm"}>
      <h3 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Estimate a clip</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Model</label>
          <select value={slug} onChange={(e) => chooseModel(e.target.value)} className={`${sel} w-full`}>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Duration (sec)</label>
          <input
            type="number"
            min={Math.min(...model.durations)}
            max={Math.max(...model.durations)}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`${sel} w-full`}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Resolution</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={`${sel} w-full`}>
            {model.resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-3 border-t border-hairline pt-3">
        <span className="font-[family-name:var(--font-jetbrains)] text-3xl font-semibold text-accent">
          {cost !== null ? `≈ ${money(cost)}` : card || failed ? "—" : "…"}
        </span>
        <span className="text-sm text-muted">
          {cost !== null ? `${duration}s · ${resolution} · live rates` : failed ? "Rates unavailable right now" : `${duration}s · ${resolution}`}
        </span>
      </div>
    </div>
  );
}
