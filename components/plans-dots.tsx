// Decorative animated line-and-dot field. Three variants so different pages
// look related but not identical. Stretches full-width (preserveAspectRatio none).

type Line = { id: string; d: string; dur: number; begin: number };
type Variant = { lines: Line[]; node?: { x: number; y: number } };

// A: sweep in from the left, join at a center node, split back out right.
const A: Variant = {
  node: { x: 760, y: 320 },
  lines: [
    { id: "a-in1", d: "M-120 70 C 260 130, 560 300, 760 320", dur: 7, begin: 0 },
    { id: "a-in2", d: "M-120 560 C 260 520, 560 340, 760 320", dur: 8, begin: 1.2 },
    { id: "a-in3", d: "M-120 300 C 300 300, 560 318, 760 320", dur: 6.5, begin: 2.4 },
    { id: "a-out1", d: "M760 320 C 1000 300, 1220 120, 1560 110", dur: 7.5, begin: 0.6 },
    { id: "a-out2", d: "M760 320 C 1000 340, 1220 520, 1560 560", dur: 8.5, begin: 1.8 },
    { id: "a-out3", d: "M760 320 C 1040 320, 1300 320, 1560 320", dur: 6, begin: 3 },
    { id: "a-s1", d: "M-120 200 C 360 40, 980 560, 1560 220", dur: 10, begin: 0.4 },
    { id: "a-s2", d: "M-120 440 C 360 600, 980 90, 1560 420", dur: 11, begin: 2 },
  ],
};

// B: join node pulled to the lower-left, wider sweeps.
const B: Variant = {
  node: { x: 520, y: 360 },
  lines: [
    { id: "b-in1", d: "M-120 120 C 260 180, 420 340, 520 360", dur: 7, begin: 0 },
    { id: "b-in2", d: "M-120 600 C 260 540, 420 380, 520 360", dur: 8, begin: 1 },
    { id: "b-out1", d: "M520 360 C 820 340, 1200 180, 1560 200", dur: 8, begin: 0.6 },
    { id: "b-out2", d: "M520 360 C 820 380, 1200 560, 1560 520", dur: 9, begin: 1.6 },
    { id: "b-s1", d: "M-120 300 C 400 120, 1000 600, 1560 320", dur: 11, begin: 0.5 },
    { id: "b-s2", d: "M-120 480 C 400 560, 1000 120, 1560 440", dur: 12, begin: 2 },
  ],
};

// C: no node — flowing horizontal waves.
const C: Variant = {
  lines: [
    { id: "c1", d: "M-120 150 C 360 70, 720 260, 1080 150 C 1300 90, 1440 190, 1560 160", dur: 9, begin: 0 },
    { id: "c2", d: "M-120 310 C 360 250, 720 410, 1080 310 C 1300 250, 1440 370, 1560 330", dur: 10, begin: 1.2 },
    { id: "c3", d: "M-120 470 C 360 410, 720 570, 1080 470 C 1300 410, 1440 530, 1560 490", dur: 11, begin: 0.6 },
    { id: "c4", d: "M-120 610 C 360 550, 720 690, 1080 610 C 1300 550, 1440 650, 1560 620", dur: 12, begin: 2 },
  ],
};

const VARIANTS: Record<string, Variant> = { a: A, b: B, c: C };

export function PlansDots({ className = "", variant = "a" }: { className?: string; variant?: "a" | "b" | "c" }) {
  const { lines, node } = VARIANTS[variant] ?? A;

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

      <g stroke="#7FA8D8" strokeWidth="1.5" opacity="0.38">
        {lines.map((l) => (
          <path key={l.id} id={l.id} d={l.d} />
        ))}
      </g>

      {node && (
        <>
          <circle cx={node.x} cy={node.y} r="10" fill="url(#pdFill)" opacity="0.5" />
          <circle cx={node.x} cy={node.y} r="2.5" fill="#FFB020" />
        </>
      )}

      <g fill="url(#pdFill)">
        {lines.map((l) => (
          <g key={`d-${l.id}`}>
            <circle r="9" />
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
