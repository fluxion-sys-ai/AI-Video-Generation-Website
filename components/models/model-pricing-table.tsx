"use client";

import { modelTint } from "@/lib/model-tint";
import { getModels, refreshCatalog, type Model } from "@/lib/models";
import { useSkin } from "@/lib/use-skin";
import { BACKEND_ENABLED } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { estimateCost, money, rateRange, ratesFor, useRateCard } from "@/lib/rate-card";

// Per-model pricing, in dollars. With a backend every figure is the hub's own
// rate for that model and resolution; the demo catalogue's per-second figures
// stand in otherwise. The *presentation* changes per skin (table / magazine
// rows / pastel cards) while the data stays the same.

export function ModelPricingTable() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const { card } = useRateCard();
  const models = getModels();
  const skin = useSkin();

  // A clip of the model's shortest advertised length, at its usual resolution.
  const sample = (m: Model) => Math.min(...m.durations);
  const clip = (m: Model) => {
    const tiers = ratesFor(card, m);
    const resolution = m.popularResolutions[0] || m.resolutions[0];
    const cost = tiers ? estimateCost(tiers, { seconds: sample(m), resolution, input_video_seconds: 0 }) : null;
    return money(cost !== null ? cost : m.usdPerSecond * sample(m));
  };
  const perSecond = (m: Model) => rateRange(ratesFor(card, m), m.resolutions) ?? money(m.usdPerSecond);

  // Editorial, a clean editorial row list (no table chrome).
  if (skin === "editorial") {
    return (
      <div>
        {models.map((m) => (
          <div key={m.slug} className="flex items-baseline justify-between gap-4 border-b border-line py-4 last:border-0">
            <div>
              <p className="text-lg font-semibold text-fg-strong">{m.name}</p>
              <p className="text-sm font-light text-muted">{m.tagline} · up to {m.resolutions[m.resolutions.length - 1]}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-fg-strong">{clip(m)}</p>
              <p className="text-xs text-muted">/ {sample(m)}s · {perSecond(m)} per second</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Playful, colorful pastel price cards.
  if (skin === "playful") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((m) => (
          <div key={m.slug} className="rounded-[20px] p-5" style={{ background: modelTint(m.slug), color: "#1a1440", boxShadow: "5px 5px 0 rgba(26,20,64,0.14)" }}>
            <p className="text-sm font-bold uppercase tracking-[0.06em]">{m.name}</p>
            <p className="mt-3 text-3xl font-extrabold">{clip(m)}</p>
            <p className="text-xs font-semibold" style={{ color: "#4a4570" }}>per {sample(m)}s clip</p>
            <p className="mt-3 text-xs" style={{ color: "#4a4570" }}>{perSecond(m)} per second · {m.resolutions.join(", ")}</p>
          </div>
        ))}
      </div>
    );
  }

  // Slideshow, a horizontal row of soft violet price chips.
  if (skin === "cosmos") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {models.map((m) => (
          <div key={m.slug} className="w-[220px] shrink-0 rounded-[14px] border border-hairline bg-surface p-5">
            <p className="font-[family-name:var(--font-space)] text-base font-semibold text-fg-strong">{m.name}</p>
            <p className="mt-3 text-3xl font-semibold text-accent-ink">{clip(m)}</p>
            <p className="text-xs text-muted">per {sample(m)}s clip · {perSecond(m)} per second</p>
            <p className="mt-2 text-xs text-fg-soft">up to {m.resolutions[m.resolutions.length - 1]}</p>
          </div>
        ))}
      </div>
    );
  }

  // OG + Luxury, the table (recolors per tokens: navy/gold under Luxury).
  return (
    <div className="overflow-x-auto border border-line-strong bg-surface/70 backdrop-blur-sm">
      <table className="w-full min-w-[560px] table-fixed text-left text-base">
        <thead className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">
          <tr className="border-b border-line-strong">
            <th className="px-5 py-3.5">Model</th>
            <th className="px-5 py-3.5">Best for</th>
            <th className="px-5 py-3.5">Max res</th>
            <th className="px-5 py-3.5 text-right">{BACKEND_ENABLED ? "$ / sec" : "Credits / sec"}</th>
            <th className="px-5 py-3.5 text-right">shortest clip</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.slug} className="border-b border-hairline last:border-0">
              <td className="px-5 py-3.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.02em] text-fg-strong">{m.name}</td>
              <td className="px-5 py-3.5 text-muted">{m.tagline}</td>
              <td className="px-5 py-3.5 text-muted">{m.resolutions[m.resolutions.length - 1]}</td>
              <td className="px-5 py-3.5 text-right font-[family-name:var(--font-jetbrains)] text-lg text-gold-bright">{perSecond(m)}</td>
              <td className="px-5 py-3.5 text-right text-fg-strong">{clip(m)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
