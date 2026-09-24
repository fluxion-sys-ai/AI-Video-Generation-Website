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
const SHORT_SIDE: Record<string, number> = { "480p": 480, "720p": 720, "1080p": 1080, "4k": 2160 };
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

/**
 * The headline rate, phrased for what the model makes.
 *
 * A video is sold by the second and an image by the picture. One function
 * because the figure is shown in seven places - the catalogue rows, the cards,
 * three pricing skins, the pricing page - and every one of them used to read
 * `usdPerSecond`, which is zero for an image: an account with an image model
 * saw "$0.00 / s" on it.
 */
export function unitRate(model: {
  modality?: "video" | "image";
  usdPerSecond: number;
  usdPerImage?: number;
}): { usd: number; unit: "s" | "image" } {
  if (model.modality === "image") return { usd: model.usdPerImage ?? 0, unit: "image" };
  return { usd: model.usdPerSecond, unit: "s" };
}

/** "$0.045 / image", "$0.07 / s". */
export function unitRateLabel(model: Parameters<typeof unitRate>[0], separator = " / "): string {
  const { usd, unit } = unitRate(model);
  return `${money(usd)}${separator}${unit}`;
}

/**
 * What a sample of this model's output costs, and what that sample is.
 *
 * For a video that is the shortest clip it sells, priced through the hub's
 * expression; for an image there is no sample to choose - one picture is the
 * whole unit - so the two come back in one shape rather than making every
 * caller ask which kind it is holding.
 */
export function sampleCost(
  model: { modality?: "video" | "image"; durations: number[]; resolutions: string[]; popularResolutions: string[]; usdPerSecond: number; usdPerImage?: number },
  tiers: ParsedTaskTier[] | undefined,
): { usd: number; label: string } {
  if (model.modality === "image") {
    return { usd: model.usdPerImage ?? 0, label: "per image" };
  }
  const seconds = model.durations.length ? Math.min(...model.durations) : 0;
  const resolution = model.popularResolutions[0] || model.resolutions[0];
  const cost = tiers ? estimateCost(tiers, { seconds, resolution, input_video_seconds: 0 }) : null;
  return { usd: cost !== null ? cost : model.usdPerSecond * seconds, label: `per ${seconds}s clip` };
}

/**
 * Whether this model's price is a function of provider tokens.
 *
 * It matters to what we may promise: for every other model the facts that
 * decide the bill are in the request, so a quote is the price. Here the
 * provider counts the tokens for the finished job - reference material
 * included, by its own rules - and that count is what settles. Anything we
 * show before the job runs is an estimate, and has to say so.
 */
export function tokenBilled(tiers: ParsedTaskTier[] | undefined): boolean {
  return Boolean(tiers?.some((tier) => tier.unitPrices.tokens !== undefined));
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
