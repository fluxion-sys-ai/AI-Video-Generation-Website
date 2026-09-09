"use client";

import { useEffect, useState } from "react";
import { getModels } from "@/lib/models";

// mock rates: resolution multiplier + $ per credit
const RES_MULT: Record<string, number> = { "480p": 1, "720p": 1.5, "1080p": 2.5 };
const PER_CREDIT = 0.01;

const sel =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue";

export function CostEstimator({ bare = false }: { bare?: boolean }) {
  const models = getModels();
  const [slug, setSlug] = useState(models[0].slug);
  const model = models.find((m) => m.slug === slug) || models[0];
  const [duration, setDuration] = useState(model.durations[0]);
  const [resolution, setResolution] = useState(model.popularResolutions[0] || model.resolutions[0]);

  useEffect(() => {
    setDuration(model.durations[0]);
    setResolution(model.popularResolutions[0] || model.resolutions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const mult = RES_MULT[resolution] ?? 1;
  const credits = Math.round(model.creditsPerSecond * duration * mult);
  const dollars = (credits * PER_CREDIT).toFixed(2);

  return (
    <div className={bare ? "" : "border border-line bg-surface/70 p-6 backdrop-blur-sm"}>
      <h3 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">
        Estimate a clip
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Model</label>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className={`${sel} w-full`}>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted">Duration (sec)</label>
          <input
            type="number"
            min={3}
            max={15}
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
      <div className="mt-4 flex items-baseline gap-3 border-t border-[rgba(124,189,242,0.14)] pt-3">
        <span className="font-[family-name:var(--font-jetbrains)] text-3xl font-semibold text-accent">≈ ${dollars}</span>
        <span className="text-sm text-muted">{credits} credits · {duration}s · {resolution}</span>
      </div>
    </div>
  );
}
