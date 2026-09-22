"use client";

/**
 * Video or image, in one control, in the three places that ask.
 *
 * It exists as a component because the first attempt was written inline twice
 * and looked wrong both times: a short bordered box beside the playground's
 * much taller model picker, with the active segment's fill running into the
 * frame. The fix is not more padding - it is that this is the same question in
 * every place it appears and should therefore be the same object.
 *
 * Two shapes, one design:
 *
 *   framed   a bordered box with a caption, for sitting beside another bordered
 *            control of the same height (the playground's model picker). The
 *            caption matters there: "Video | Image" next to a model name reads
 *            as if it might be filtering the models rather than choosing what
 *            to make.
 *   inline   a compact segmented pill for a filter row, where it is one control
 *            among several and needs no caption of its own.
 *
 * The active segment is filled and the inactive one is not, with a hairline
 * between them, so which is on is legible without relying on colour alone.
 */

export type Kind = "video" | "image";

const KINDS: Kind[] = ["video", "image"];

export function KindSwitch({
  value,
  onChange,
  counts,
  caption,
  className = "",
}: {
  value: Kind;
  onChange: (kind: Kind) => void;
  /** Shown after each label where it helps - a filter row, not the playground. */
  counts?: Partial<Record<Kind, number>>;
  /** Given, this renders the framed shape with this word above the segments. */
  caption?: string;
  className?: string;
}) {
  const segments = (
    <div className="flex items-stretch">
      {KINDS.map((kind, index) => {
        const on = kind === value;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onChange(kind)}
            aria-pressed={on}
            className={`font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.06em] transition-colors ${
              // Framed: exactly one 20px line, which is what the box beside it
              // puts under its own caption. Anything taller and the two boxes
              // no longer line up, which is what looked wrong about the first
              // version of this.
              caption ? "h-5 px-2 text-sm leading-5" : "px-3.5 py-2 text-xs"
            } ${index > 0 ? "border-l border-line" : ""} ${
              on ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-fg"
            }`}
          >
            {kind}
            {counts?.[kind] !== undefined && <span className="ml-1.5 opacity-60">{counts[kind]}</span>}
          </button>
        );
      })}
    </div>
  );

  if (!caption) {
    return (
      <div className={`flex w-fit overflow-hidden border border-line-strong bg-raised ${className}`}>{segments}</div>
    );
  }

  return (
    // The same outer shape as the control it sits beside: border, background and
    // padding match, so the two boxes line up top and bottom instead of one
    // floating in the middle of the other.
    <div className={`w-fit border border-line-strong bg-raised px-3 py-2.5 ${className}`}>
      <span className="block text-[10px] uppercase tracking-[0.08em] text-dim">{caption}</span>
      {/* Pulled out to the box's padding so the segments' own fill reaches the
          same left edge as the caption above them, and no vertical gap, because
          the box beside it stacks its two lines the same way. */}
      <div className="-ml-2">{segments}</div>
    </div>
  );
}
