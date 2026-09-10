import { getModels } from "@/lib/models";

// Per-model pricing table (fal.ai-style). Credits are the app's unit;
// the $ column assumes 1 credit ≈ $0.01 for an illustrative price.
export function ModelPricingTable() {
  const models = getModels();

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
              <td className="px-5 py-3.5 font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.02em] text-fg-strong">
                {m.name}
              </td>
              <td className="px-5 py-3.5 text-muted">{m.tagline}</td>
              <td className="px-5 py-3.5 text-muted">{m.resolutions[m.resolutions.length - 1]}</td>
              <td className="px-5 py-3.5 text-right font-[family-name:var(--font-jetbrains)] text-lg text-gold-bright">
                {m.creditsPerSecond}
              </td>
              <td className="px-5 py-3.5 text-right text-fg-strong">
                ${(m.creditsPerSecond * 5 * 0.01).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
