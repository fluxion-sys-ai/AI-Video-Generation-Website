// Decorative animation for the pricing page: orange dots run left->right along
// curved lines in the bands ABOVE and BELOW the plans, never through the boxes.
// Stretches to its container (preserveAspectRatio none); the middle stays clear.
export function PlansDots({ className = "" }: { className?: string }) {
  const dur = (s: number) => `${s}s`;
  const paths = [
    { id: "tp1", d: "M-40 70 C 300 20, 900 110, 1240 55", t: 9, begin: 0 },
    { id: "tp2", d: "M-40 110 C 360 150, 840 40, 1240 100", t: 11, begin: 1.6 },
    { id: "bp1", d: "M-40 560 C 300 610, 900 510, 1240 585", t: 10, begin: 0.8 },
    { id: "bp2", d: "M-40 600 C 360 545, 840 620, 1240 555", t: 12, begin: 2.4 },
  ];

  return (
    <svg
      className={className}
      viewBox="0 0 1200 640"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <filter id="pdglow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* curved guide lines */}
      <g stroke="#AECBF0" strokeWidth="1" opacity="0.25">
        {paths.map((p) => (
          <path key={p.id} id={p.id} d={p.d} />
        ))}
      </g>

      {/* orange dots running left -> right */}
      <g fill="#FFC15E" filter="url(#pdglow)">
        {paths.map((p) => (
          <g key={`d-${p.id}`}>
            <circle r="3" />
            <animateMotion
              dur={dur(p.t)}
              begin={dur(p.begin)}
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath xlinkHref={`#${p.id}`} />
            </animateMotion>
          </g>
        ))}
      </g>
    </svg>
  );
}
