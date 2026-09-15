"use client";

// Live per-model prices from the backend, parsed into tiers so the pricing UI
// shows exactly what the hub bills. Prices live in the hub's database and are
// edited in its admin UI; see lib/pricing-expr.ts for the expression format.

import { useEffect, useState } from "react";
import { getPricing } from "./hub";
import { estimateCost, matchTier, parseTaskTiers, perSecondPrice, type ParsedTaskTier } from "./pricing-expr";

/** Tiers keyed by the hub's model name. */
export type RateCard = Record<string, ParsedTaskTier[]>;

let cached: Promise<RateCard> | null = null;

export function loadRateCard(): Promise<RateCard> {
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

export function useRateCard(): { card: RateCard | null; failed: boolean } {
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

export function ratesFor(card: RateCard | null, model: { slug: string; hubModel?: string }): ParsedTaskTier[] | undefined {
  if (!card) return undefined;
  return card[model.hubModel || model.slug];
}

/** Dollars with cents, keeping a third decimal only when a rate needs it ($0.045). */
export function money(n: number): string {
  const cents = n.toFixed(2);
  return Math.abs(Number(cents) - n) < 1e-9 ? `$${cents}` : `$${n.toFixed(3)}`;
}

/** "$0.03" or "$0.03-$0.045" across the resolutions a model offers. */
export function rateRange(tiers: ParsedTaskTier[] | undefined, resolutions: string[]): string | null {
  if (!tiers) return null;
  const rates = resolutions.map((r) => perSecondPrice(tiers, { resolution: r })).filter((v): v is number => v !== null);
  if (!rates.length) return null;
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  return lo === hi ? money(lo) : `${money(lo)}-${money(hi)}`;
}

/**
 * What each priced fact contributes to a price, so a customer can be shown why
 * a generation costs what it does: output seconds, reference video seconds, and
 * images past the free allowance are all separate terms in the hub's
 * expression, and this splits the total back into them.
 */
export function costBreakdown(
  tiers: ParsedTaskTier[] | undefined,
  facts: Record<string, string | number | boolean>,
): { total: number; lines: { field: string; units: number; usd: number }[] } | null {
  if (!tiers) return null;
  const tier = matchTier(tiers, facts);
  if (!tier) return null;
  const lines: { field: string; units: number; usd: number }[] = [];
  let total = tier.constant;
  for (const [field, price] of Object.entries(tier.unitPrices)) {
    const units = Number(facts[field] ?? 0);
    if (!Number.isFinite(units) || units <= 0) continue;
    const usd = units * price;
    total += usd;
    lines.push({ field, units, usd });
  }
  return { total, lines };
}

export { estimateCost, perSecondPrice };
