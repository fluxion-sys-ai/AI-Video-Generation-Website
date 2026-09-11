// Decorative ambient background, soft, slowly-drifting blurred light "auras"
// (replaces the old animated dot-on-line field). Elegant and calm; reads its
// colors from theme tokens so it recolors per skin. Export name + props are
// unchanged so existing pages don't need edits. Respects reduced motion.

type Blob = { top: string; left: string; size: string; dur: number; delay: number; dir: "x" | "y" | "xy" };

const A: Blob[] = [
  { top: "8%", left: "12%", size: "42vw", dur: 26, delay: 0, dir: "xy" },
  { top: "44%", left: "62%", size: "36vw", dur: 32, delay: 3, dir: "y" },
  { top: "68%", left: "20%", size: "30vw", dur: 29, delay: 1.5, dir: "x" },
];
const B: Blob[] = [
  { top: "-4%", left: "58%", size: "40vw", dur: 30, delay: 0, dir: "xy" },
  { top: "50%", left: "8%", size: "34vw", dur: 27, delay: 2, dir: "x" },
  { top: "72%", left: "66%", size: "28vw", dur: 34, delay: 4, dir: "y" },
];
const C: Blob[] = [
  { top: "6%", left: "70%", size: "38vw", dur: 33, delay: 1, dir: "y" },
  { top: "38%", left: "30%", size: "44vw", dur: 28, delay: 0, dir: "xy" },
  { top: "78%", left: "50%", size: "26vw", dur: 31, delay: 2.5, dir: "x" },
];

const VARIANTS: Record<string, Blob[]> = { a: A, b: B, c: C };

export function PlansDots({ className = "", variant = "a" }: { className?: string; variant?: "a" | "b" | "c" }) {
  const blobs = VARIANTS[variant] ?? A;
  return (
    <div className={`${className} overflow-hidden`} aria-hidden="true">
      {blobs.map((b, i) => (
        <span
          key={i}
          className={`ambient-blob ambient-${b.dir}`}
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
