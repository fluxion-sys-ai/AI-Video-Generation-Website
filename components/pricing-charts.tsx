import { getModels } from "@/lib/models";

// Single-series magnitude bars — one accent hue, value labels in ink tokens.
function BarRow({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = Math.max(4, (value / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[#C7D4E6]">{label}</span>
        <span className="font-[family-name:var(--font-jetbrains)] text-[#FFB020]">{display}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#101E36]" role="img" aria-label={`${label}: ${display}`}>
        <div className="h-full rounded-full bg-[#FF8A1E]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function PricingCharts() {
  const models = getModels();
  const maxCps = Math.max(...models.map((m) => m.creditsPerSecond));

  return (
    <div>
      <h3 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#E0A24E]">
        Credits / second by model
      </h3>
      <div className="mt-4 space-y-3">
        {models.map((m) => (
          <BarRow key={m.slug} label={m.name} value={m.creditsPerSecond} max={maxCps} display={`${m.creditsPerSecond}`} />
        ))}
      </div>
    </div>
  );
}
