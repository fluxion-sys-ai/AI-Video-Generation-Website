"use client";

// "Preview" on a model nobody else can see.
//
// An unpublished model reaches one account because somebody was let in on it
// (scripts/preview_access.py in the backend). It is otherwise an ordinary card,
// which is the problem: without a mark, a customer cannot tell that the thing
// they just found is unreleased, and will wonder why a colleague cannot find it
// or why it disappears again.
//
// It lives in its own file because a model appears in several places and the
// site is skinnable - the catalogue alone draws its cards five different ways -
// so the mark has to be one thing that travels, not five near-copies.

export function PreviewBadge({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  const style =
    tone === "light"
      ? "border-black/15 bg-white/85 text-[#1a1440]"
      : "border-accent/60 bg-accent-soft text-accent-ink";
  return (
    <span
      title="Not released yet - your account has early access"
      className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] backdrop-blur ${style} ${className}`}
    >
      Preview
    </span>
  );
}
