// Decorative animated line-and-dot field. Each line is a single continuous
// path that runs fully off-screen left to off-screen right, so a dot never
// stops or vanishes mid-view — it glides in from the left edge, across, and
// out the right edge, then loops off-screen. Kept faint so it never distracts.

type Line = { id: string; d: string; dur: number; begin: number };

// A: default (pricing) — gentle full-width flows.
const A: Line[] = [
  { id: "a1", d: "M-160 150 C 320 110, 780 250, 1600 230", dur: 16, begin: 0 },
  { id: "a2", d: "M-160 300 C 360 300, 900 330, 1600 320", dur: 19, begin: 2.5 },
  { id: "a3", d: "M-160 460 C 340 500, 820 360, 1600 410", dur: 17, begin: 1.2 },
  { id: "a4", d: "M-160 580 C 420 560, 980 470, 1600 540", dur: 21, begin: 4 },
];

// B: different offsets/curves.
const B: Line[] = [
  { id: "b1", d: "M-160 120 C 380 160, 820 300, 1600 210", dur: 18, begin: 0.5 },
  { id: "b2", d: "M-160 330 C 360 300, 900 360, 1600 300", dur: 20, begin: 2 },
  { id: "b3", d: "M-160 520 C 400 560, 980 400, 1600 470", dur: 17, begin: 3.2 },
];

// C: flowing horizontal waves.
const C: Line[] = [
  { id: "c1", d: "M-160 170 C 360 90, 720 260, 1080 170 C 1320 100, 1460 200, 1600 175", dur: 22, begin: 0 },
  { id: "c2", d: "M-160 330 C 360 270, 720 420, 1080 330 C 1320 270, 1460 380, 1600 345", dur: 24, begin: 2 },
  { id: "c3", d: "M-160 500 C 360 440, 720 600, 1080 500 C 1320 440, 1460 550, 1600 515", dur: 26, begin: 1 },
];

const VARIANTS: Record<string, Line[]> = { a: A, b: B, c: C };

export function PlansDots({ className = "", variant = "a" }: { className?: string; variant?: "a" | "b" | "c" }) {
  const lines = VARIANTS[variant] ?? A;

  return (
    <svg
      className={className}
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <radialGradient id="pdFill" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE0A0" />
          <stop offset="0.4" stopColor="#FFC15E" />
          <stop offset="1" stopColor="#FFC15E" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g stroke="#7FA8D8" strokeWidth="1.5" opacity="0.14">
        {lines.map((l) => (
          <path key={l.id} id={l.id} d={l.d} />
        ))}
      </g>

      <g fill="url(#pdFill)" opacity="0.5">
        {lines.map((l) => (
          <g key={`d-${l.id}`}>
            <circle r="7" />
            <animateMotion
              dur={`${l.dur}s`}
              begin={`${l.begin}s`}
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath xlinkHref={`#${l.id}`} />
            </animateMotion>
          </g>
        ))}
      </g>
    </svg>
  );
}
