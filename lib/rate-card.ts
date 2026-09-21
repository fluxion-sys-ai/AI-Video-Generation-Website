"use client";

// Live per-model prices from the backend, parsed into tiers so the pricing UI
// shows exactly what the hub bills. Prices live in the hub's database and are
// edited in its admin UI; see lib/pricing-expr.ts for the expression format.

import { useEffect, useState } from "react";
import { getPricing } from "./hub";
import { estimateCost, matchTier, parseTaskTiers, perSecondPrice, type ParsedTaskTier } from "./pricing-expr";

/** Tiers keyed by the hub's model name. */
/**
 * The provider's token estimate for one clip, in the provider's own formula.
 *
 * BytePlus bills ModelArk by pixels, not by seconds:
 *
 *     tokens = width * height * frame_rate * duration / 1024
 *
 * which means the aspect ratio changes the bill as much as the resolution does:
 * at "480p" a 1:1 clip is 480x480 and a 21:9 clip is 1120x480, the same named
 * resolution for 2.3x the cost. The short side is the named resolution and the
 * long side follows the ratio.
 *
 * This has to match plugins/fluxion-seedance/plugin.js exactly - it is the same
 * arithmetic on the same inputs, so that what the playground quotes is what the
 * backend charges rather than a second opinion about it.
 *
 * Models priced per second ignore the `tokens` fact entirely; supplying it
 * costs them nothing.
 */
const FRAME_RATE = 24;
const SHORT_SIDE: Record<string, number> = { "480p": 480, "720p": 720, "1080p": 1080 };
const RATIO_VALUE: Record<string, number> = {
  "21:9": 21 / 9,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  // The model picks; reserve the widest shape, as the plugin does.
  adaptive: 21 / 9,
};

export function estimateTokens(resolution: string, ratio: string, seconds: number): number {
  const short = SHORT_SIDE[String(resolution).toLowerCase()];
  if (!short || !Number.isFinite(seconds) || seconds <= 0) return 0;
  const value = RATIO_VALUE[ratio] ?? RATIO_VALUE["16:9"];
  const width = value >= 1 ? Math.round(short * value) : short;
  const height = value >= 1 ? short : Math.round(short / value);
  return Math.round((width * height * FRAME_RATE * seconds) / 1024);
}

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
