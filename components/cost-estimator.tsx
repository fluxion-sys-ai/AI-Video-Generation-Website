"use client";

import { useEffect, useState } from "react";
import { getModels } from "@/lib/models";

// mock rates: resolution multiplier + $ per credit
const RES_MULT: Record<string, number> = { "480p": 1, "720p": 1.5, "1080p": 2.5 };
const PER_CREDIT = 0.01;

const sel =
  "rounded-none border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] font-[family-name:var(--font-geist-sans)] outline-none focus:border-[#7CBDF2]";

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
    <div className={bare ? "" : "border border-[#2E466B] bg-[#0B1524]/70 p-6 backdrop-blur-sm"}>
      <h3 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#C7D4E6]">
        Estimate a clip
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Model</label>
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className={`${sel} w-full`}>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Duration (sec)</label>
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
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Resolution</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={`${sel} w-full`}>
            {model.resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-3 border-t border-[rgba(124,189,242,0.14)] pt-3">
        <span className="font-[family-name:var(--font-jetbrains)] text-3xl font-semibold text-[#FF8A1E]">≈ ${dollars}</span>
        <span className="text-sm text-[#9FB2CC]">{credits} credits · {duration}s · {resolution}</span>
      </div>
    </div>
  );
}
