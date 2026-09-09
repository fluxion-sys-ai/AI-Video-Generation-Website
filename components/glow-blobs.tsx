// Big soft glowing blobs, placed asymmetrically per page, with a slow glitter
// pulse. Fixed full-viewport background (kept subtle so text stays readable).

type Blob = { cx: number; cy: number; r: number; c: "o" | "b"; base: number; dur: number; begin: number };

// each variant = a unique, asymmetric arrangement
const VARIANTS: Record<string, Blob[]> = {
  a: [
    { cx: 180, cy: 170, r: 230, c: "o", base: 0.3, dur: 7, begin: 0 },
    { cx: 320, cy: 120, r: 90, c: "o", base: 0.42, dur: 5.5, begin: 1.5 },
    { cx: 1180, cy: 760, r: 200, c: "o", base: 0.26, dur: 8, begin: 0.6 },
    { cx: 1320, cy: 300, r: 120, c: "b", base: 0.24, dur: 6.5, begin: 2.2 },
    { cx: 90, cy: 620, r: 70, c: "o", base: 0.4, dur: 5, begin: 3 },
  ],
  b: [
    { cx: 120, cy: 780, r: 240, c: "o", base: 0.3, dur: 7.5, begin: 0.4 },
    { cx: 1280, cy: 150, r: 190, c: "o", base: 0.28, dur: 6.5, begin: 1.2 },
    { cx: 1120, cy: 120, r: 80, c: "o", base: 0.44, dur: 5, begin: 2.4 },
    { cx: 640, cy: 840, r: 110, c: "b", base: 0.22, dur: 8, begin: 0 },
    { cx: 1360, cy: 620, r: 70, c: "o", base: 0.4, dur: 5.5, begin: 3.2 },
  ],
  c: [
    { cx: 1280, cy: 460, r: 240, c: "o", base: 0.28, dur: 8, begin: 0 },
    { cx: 1180, cy: 200, r: 90, c: "o", base: 0.42, dur: 5, begin: 1.6 },
    { cx: 160, cy: 260, r: 150, c: "b", base: 0.22, dur: 7, begin: 0.8 },
    { cx: 240, cy: 720, r: 100, c: "o", base: 0.34, dur: 6, begin: 2.6 },
    { cx: 700, cy: 120, r: 70, c: "o", base: 0.36, dur: 5.5, begin: 3.4 },
  ],
  d: [
    { cx: 240, cy: 200, r: 150, c: "o", base: 0.36, dur: 6, begin: 0.2 },
    { cx: 1180, cy: 680, r: 220, c: "o", base: 0.28, dur: 7.5, begin: 1 },
    { cx: 980, cy: 160, r: 90, c: "b", base: 0.24, dur: 6.5, begin: 2 },
    { cx: 120, cy: 820, r: 80, c: "o", base: 0.4, dur: 5, begin: 3 },
  ],
};

export function GlowBlobs({ className = "", variant = "a" }: { className?: string; variant?: "a" | "b" | "c" | "d" }) {
  const blobs = VARIANTS[variant] ?? VARIANTS.a;
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="blob-o" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFC15E" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#FF8A1E" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FF8A1E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blob-b" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7CBDF2" stopOpacity="0.8" />
          <stop offset="1" stopColor="#7CBDF2" stopOpacity="0" />
        </radialGradient>
      </defs>
      {blobs.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.c === "o" ? "url(#blob-o)" : "url(#blob-b)"} opacity={b.base} />
      ))}
    </svg>
  );
}
