"use client";

// Daily usage bar chart (mock standin values). Responsive full-width HTML/CSS
// so axis labels stay crisp. X axis = day, Y axis = dollars. Hovering a bar
// shows a tooltip with that day's date + amount.

import { useState } from "react";

const DEFAULT = [2, 1, 0, 3, 5, 2, 4, 3, 6, 4, 2, 7, 5, 8, 6, 3, 5, 9, 7, 4];

// Build M/D labels for the N days ending on END (deterministic, no Date.now).
const END = new Date(2026, 8, 9); // 2026-09-09
function dayLabels(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(END);
    d.setDate(END.getDate() - i);
    out.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return out;
}

function niceTop(max: number): number {
  if (max <= 5) return 5;
  return Math.ceil(max / 5) * 5;
}

export function UsageChart({
  className = "",
  data = DEFAULT,
  plotHeight = 150,
}: {
  className?: string;
  data?: number[];
  plotHeight?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const labels = dayLabels(data.length);
  const top = niceTop(Math.max(...data, 1));
  const ticks = [top, (top * 3) / 4, top / 2, top / 4, 0];
  // Only label ~every Nth day (plus the last) so labels never crowd/wrap when
  // the panel is narrow. Each slot still aligns under its bar.
  const step = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Y axis */}
      <div
        className="flex flex-col justify-between text-right font-[family-name:var(--font-jetbrains)] text-[10px] text-dim"
        style={{ height: plotHeight }}
      >
        {ticks.map((t) => (
          <span key={t}>${Number.isInteger(t) ? t : t.toFixed(1)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        {/* plot area with horizontal gridlines */}
        <div
          className="relative flex items-end gap-[3px] border-b border-l border-line"
          style={{ height: plotHeight }}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.slice(0, -1).map((t) => (
            <span
              key={t}
              className="pointer-events-none absolute left-0 right-0 border-t border-hairline"
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}
          {data.map((v, i) => (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              className="relative flex-1 cursor-default rounded-t-[2px] transition-colors"
              style={{
                height: `${Math.max((v / top) * 100, 1.5)}%`,
                background: hover === i ? "var(--c-accent)" : "var(--c-chart-bar)",
              }}
            />
          ))}

          {/* hover tooltip */}
          {hover !== null && (
            <div
              className="pointer-events-none absolute z-10 whitespace-nowrap border border-line bg-panel px-2 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] text-fg shadow-lg shadow-black/30"
              style={{
                left: `${Math.min(Math.max(((hover + 0.5) / data.length) * 100, 10), 90)}%`,
                bottom: `${Math.max((data[hover] / top) * 100, 1.5)}%`,
                transform: "translate(-50%, -6px)",
              }}
            >
              {labels[hover]} · <span className="text-gold">${data[hover]}</span>
            </div>
          )}
        </div>
        {/* X axis — sparse labels (every `step` days + the last), no wrapping */}
        <div className="mt-1.5 flex gap-[3px] font-[family-name:var(--font-jetbrains)] text-[9px] text-dim">
          {labels.map((l, i) => (
            <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
              {i % step === 0 || i === labels.length - 1 ? l : " "}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
