"use client";

/**
 * Video or image, in one control, in the places that ask.
 *
 * It is a component because it is the same question everywhere it appears and
 * should therefore be the same object. Written inline it looked wrong twice:
 * first as a bordered box beside the playground's much taller bordered model
 * picker, then as a framed box with a caption, which was worse - a labelled
 * form field for what is really a pair of tabs.
 *
 * So: tabs, like the Playground / API pair they sit beside, and deliberately
 * *not* identical to them. Those fill the active tab; this underlines it. Two
 * borderless tab groups on one bar would otherwise read as one group of four,
 * and they answer different questions - what to make, and what to look at.
 */

export type Kind = "video" | "image";

const KINDS: Kind[] = ["video", "image"];

export function KindSwitch({
  value,
  onChange,
  counts,
  className = "",
}: {
  value: Kind;
  onChange: (kind: Kind) => void;
  /** Shown after each label where it helps - a filter row, not the playground. */
  counts?: Partial<Record<Kind, number>>;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex gap-4 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] ${className}`}
    >
      {KINDS.map((kind) => {
        const on = kind === value;
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(kind)}
            className={`border-b-2 pb-1.5 transition-colors ${
              on ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {kind}
            {counts?.[kind] !== undefined && <span className="ml-1.5 opacity-60">{counts[kind]}</span>}
          </button>
        );
      })}
    </div>
  );
}
