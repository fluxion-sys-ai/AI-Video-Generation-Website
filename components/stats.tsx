const STATS = [
  { value: "3.5K+", label: "Leading developers" },
  { value: "10x", label: "Cost savings" },
  { value: "100x", label: "Inference speedup" },
  { value: "99.9%", label: "SLA" },
];

export function Stats() {
  return (
    <section className="border-y border-[rgba(124,189,242,0.12)] px-8 py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-[#FFB020] sm:text-5xl">
              {s.value}
            </div>
            <div className="mt-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-[#9FB2CC]">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
