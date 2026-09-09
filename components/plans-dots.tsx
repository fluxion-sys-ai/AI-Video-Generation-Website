// Decorative animation for the pricing page: big curved lines that sweep in
// from the left, converge at a node, and split back out off the right edge,
// with neon dots riding along them. Stretches full-width (preserveAspectRatio none).

type Line = { id: string; d: string; dur: number; begin: number };

// join node around (760, 320)
const LINES: Line[] = [
  // flow into the node from the left
  { id: "in1", d: "M-120 70 C 260 130, 560 300, 760 320", dur: 7, begin: 0 },
  { id: "in2", d: "M-120 560 C 260 520, 560 340, 760 320", dur: 8, begin: 1.2 },
  { id: "in3", d: "M-120 300 C 300 300, 560 318, 760 320", dur: 6.5, begin: 2.4 },
  // split back out to the right, off screen
  { id: "out1", d: "M760 320 C 1000 300, 1220 120, 1560 110", dur: 7.5, begin: 0.6 },
  { id: "out2", d: "M760 320 C 1000 340, 1220 520, 1560 560", dur: 8.5, begin: 1.8 },
  { id: "out3", d: "M760 320 C 1040 320, 1300 320, 1560 320", dur: 6, begin: 3 },
  // free-flowing sweeps across the whole width
  { id: "s1", d: "M-120 200 C 360 40, 980 560, 1560 220", dur: 10, begin: 0.4 },
  { id: "s2", d: "M-120 440 C 360 600, 980 90, 1560 420", dur: 11, begin: 2 },
];

export function PlansDots({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 640"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <radialGradient id="pdFill" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFD98A" />
          <stop offset="0.4" stopColor="#FF8A1E" />
          <stop offset="1" stopColor="#FF8A1E" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* guide lines */}
      <g stroke="#7FA8D8" strokeWidth="1.2" opacity="0.22">
        {LINES.map((l) => (
          <path key={l.id} id={l.id} d={l.d} />
        ))}
      </g>

      {/* join node glow */}
      <circle cx="760" cy="320" r="10" fill="url(#pdFill)" opacity="0.5" />
      <circle cx="760" cy="320" r="2.5" fill="#FFB020" />

      {/* neon dots riding each line, left -> right, off screen */}
      <g fill="url(#pdFill)">
        {LINES.map((l) => (
          <g key={`d-${l.id}`}>
            <circle r="6" />
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
