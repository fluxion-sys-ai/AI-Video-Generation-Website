"use client";

// What a clip costs, in dollars, at the rate the backend is actually charging.
//
// With a backend every figure here comes from the hub's rate card for that
// model and resolution (lib/rate-card.ts, fed by the pricing expression in the
// database). Without one, the demo catalogue's own per-second figures stand in,
// and the panel says so.

import { useEffect, useState } from "react";
import { getAvailableModels, refreshCatalog } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { estimateCost, money, ratesFor, useRateCard } from "@/lib/rate-card";
import { NumberField, isPositive } from "@/components/ui/number-field";

const sel =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue";

export function CostEstimator({ bare = false }: { bare?: boolean }) {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const { card } = useRateCard();
  const models = getAvailableModels();
  const [slug, setSlug] = useState("");
  const model = models.find((m) => m.slug === slug) ?? models[0];
  const [duration, setDuration] = useState<number | null>(null);
  const [resolution, setResolution] = useState("");

  // Follow whichever model is selected, and adopt the first one the catalogue
  // offers once it arrives.
  useEffect(() => {
    if (!model) return;
    if (slug !== model.slug) setSlug(model.slug);
    setDuration(model.durations[0]);
    setResolution(model.popularResolutions[0] || model.resolutions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.slug]);

  if (!model) {
    return (
      <div className={bare ? "" : "border border-line bg-surface/70 p-6 backdrop-blur-sm"}>
        <p className="text-sm text-muted">Loading the catalogue…</p>
      </div>
    );
  }

  const seconds = duration;
  const valid = isPositive(seconds);
  const tiers = ratesFor(card, model);
  const live = valid && tiers ? estimateCost(tiers, { seconds, resolution, input_video_seconds: 0 }) : null;
  // The demo catalogue carries one rate per model; the backend prices by resolution.
  const cost = live !== null ? live : valid ? model.usdPerSecond * seconds : null;

  return (
    <div className={bare ? "" : "border border-line bg-surface/70 p-6 backdrop-blur-sm"}>
      <h3 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">
        Estimate a clip
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="est-model" className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Model</label>
          <select id="est-model" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${sel} w-full`}>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="est-duration" className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Duration (sec)</label>
          <NumberField
            id="est-duration"
            min={Math.min(...model.durations)}
            max={Math.max(...model.durations)}
            value={duration}
            onValueChange={setDuration}
            className={`${sel} w-full`}
          />
        </div>
        <div>
          <label htmlFor="est-resolution" className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Resolution</label>
          <select id="est-resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} className={`${sel} w-full`}>
            {model.resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-3 border-t border-hairline pt-3">
        <span className="font-[family-name:var(--font-jetbrains)] text-3xl font-semibold text-accent-ink">
          {cost === null ? "—" : `≈ ${money(cost)}`}
        </span>
        <span className="text-sm text-muted">
          {cost === null
            ? "enter a duration"
            : `${seconds}s · ${resolution}${live !== null ? "" : " · demo rate"}`}
        </span>
      </div>
    </div>
  );
}
