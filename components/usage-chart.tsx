// Compact daily-usage bar chart (mock data — standin values). Square edges,
// orange bars, scales to its container width.
const DEFAULT = [2, 1, 0, 3, 5, 2, 4, 3, 6, 4, 2, 7, 5, 8, 6, 3, 5, 9, 7, 4];

export function UsageChart({
  className = "",
  data = DEFAULT,
  height = 96,
}: {
  className?: string;
  data?: number[];
  height?: number;
}) {
  const W = 600;
  const H = 200;
  const pad = 6;
  const n = data.length;
  const max = Math.max(...data, 1);
  const slot = (W - pad * 2) / n;
  const barW = slot * 0.62;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ height, width: "100%" }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ucBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB020" />
          <stop offset="1" stopColor="#FF8A1E" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line x1={pad} y1={H - 1} x2={W - pad} y2={H - 1} stroke="rgba(124,189,242,0.18)" strokeWidth="1" />
      {data.map((v, i) => {
        const h = (v / max) * (H - 16);
        const x = pad + i * slot + (slot - barW) / 2;
        const y = H - h;
        return <rect key={i} x={x} y={y} width={barW} height={Math.max(h, 1)} fill="url(#ucBar)" />;
      })}
    </svg>
  );
}
