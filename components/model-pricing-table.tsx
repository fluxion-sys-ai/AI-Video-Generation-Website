import { getModels } from "@/lib/models";

// Per-model pricing table (fal.ai-style). Credits are the app's unit;
// the $ column assumes 1 credit ≈ $0.01 for an illustrative price.
export function ModelPricingTable() {
  const models = getModels();

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[#33507C] bg-[#0B1524]/70 backdrop-blur-sm">
      <table className="w-full min-w-[560px] text-left text-base">
        <thead className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-[#9FB2CC]">
          <tr className="border-b border-[#33507C]">
            <th className="px-6 py-5">Model</th>
            <th className="px-6 py-5">Best for</th>
            <th className="px-6 py-5">Max res</th>
            <th className="px-6 py-5 text-right">Credits / sec</th>
            <th className="px-6 py-5 text-right">≈ $ / 5s clip</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.slug} className="border-b border-[rgba(124,189,242,0.12)] last:border-0">
              <td className="px-6 py-5 font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.02em] text-[#F4F8FE]">
                {m.name}
              </td>
              <td className="px-6 py-5 text-[#9FB2CC]">{m.tagline}</td>
              <td className="px-6 py-5 text-[#9FB2CC]">{m.resolutions[m.resolutions.length - 1]}</td>
              <td className="px-6 py-5 text-right font-[family-name:var(--font-jetbrains)] text-lg text-[#FFB020]">
                {m.creditsPerSecond}
              </td>
              <td className="px-6 py-5 text-right text-[#F4F8FE]">
                ${(m.creditsPerSecond * 5 * 0.01).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
