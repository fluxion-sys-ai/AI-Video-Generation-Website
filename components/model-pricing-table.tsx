"use client";

import { getModels } from "@/lib/models";
import { useSkin } from "@/lib/use-skin";

// Per-model pricing. Credits are the app's unit; the $ column assumes
// 1 credit ≈ $0.01 for an illustrative price. The *presentation* changes per
// skin (table / magazine rows / pastel cards) while the data stays the same.
const price = (creditsPerSecond: number) => (creditsPerSecond * 5 * 0.01).toFixed(2);
const PLAY_PASTELS = ["#fff2c2", "#d9ecff", "#ffd9ec", "#d9f5e6"];

export function ModelPricingTable() {
  const models = getModels();
  const skin = useSkin();

  // Editorial — a clean editorial row list (no table chrome).
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
              <p className="text-xl font-semibold text-fg-strong">${price(m.creditsPerSecond)}</p>
              <p className="text-xs text-muted">/ 5s · {m.creditsPerSecond} cr/s</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Playful — colorful pastel price cards.
  if (skin === "playful") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((m, i) => (
          <div key={m.slug} className="rounded-[20px] p-5" style={{ background: PLAY_PASTELS[i % PLAY_PASTELS.length], color: "#1a1440", boxShadow: "5px 5px 0 rgba(26,20,64,0.14)" }}>
            <p className="text-sm font-bold uppercase tracking-[0.06em]">{m.name}</p>
            <p className="mt-3 text-3xl font-extrabold">${price(m.creditsPerSecond)}</p>
            <p className="text-xs font-semibold" style={{ color: "#4a4570" }}>per 5s clip</p>
            <p className="mt-3 text-xs" style={{ color: "#4a4570" }}>{m.creditsPerSecond} cr/s · {m.resolutions[m.resolutions.length - 1]}</p>
          </div>
        ))}
      </div>
    );
  }

  // OG + Luxury — the table (recolors per tokens: navy/gold under Luxury).
  return (
    <div className="overflow-x-auto border border-line-strong bg-surface/70 backdrop-blur-sm">
      <table className="w-full min-w-[560px] table-fixed text-left text-base">
        <thead className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">
          <tr className="border-b border-line-strong">
            <th className="px-5 py-3.5">Model</th>
            <th className="px-5 py-3.5">Best for</th>
            <th className="px-5 py-3.5">Max res</th>
            <th className="px-5 py-3.5 text-right">Credits / sec</th>
            <th className="px-5 py-3.5 text-right">≈ $ / 5s clip</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.slug} className="border-b border-hairline last:border-0">
              <td className="px-5 py-3.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.02em] text-fg-strong">{m.name}</td>
              <td className="px-5 py-3.5 text-muted">{m.tagline}</td>
              <td className="px-5 py-3.5 text-muted">{m.resolutions[m.resolutions.length - 1]}</td>
              <td className="px-5 py-3.5 text-right font-[family-name:var(--font-jetbrains)] text-lg text-gold-bright">{m.creditsPerSecond}</td>
              <td className="px-5 py-3.5 text-right text-fg-strong">${price(m.creditsPerSecond)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
