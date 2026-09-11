"use client";

// TEMP — floating skin switcher so all three site themes can be compared across
// the real pages (full functionality). Persists via lib/prefs (fluxion.skin) and
// is applied to <html> before paint by the boot script in app/layout.tsx.
// Remove this component (and its mount in layout.tsx) once a direction is chosen.

import { useEffect, useState } from "react";
import { getSkin, applySkin, type Skin } from "@/lib/prefs";

const OPTIONS: { key: Skin; label: string }[] = [
  { key: "og", label: "OG" },
  { key: "editorial", label: "Editorial" },
  { key: "expedition", label: "Expedition" },
];

export function SkinSwitcher() {
  const [skin, setSkin] = useState<Skin>("og");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setSkin(getSkin());
    setMounted(true);
  }, []);

  function pick(s: Skin) {
    applySkin(s);
    setSkin(s);
  }

  // Avoid an SSR/client highlight mismatch — render only after mount.
  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 print:hidden">
      {open ? (
        <div className="flex flex-col gap-1.5 rounded-[var(--radius-control)] border border-line bg-panel/95 p-2 shadow-lg shadow-black/20 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.14em] text-accent-ink">
              Theme preview
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Collapse theme switcher"
              className="hit text-dim transition-colors hover:text-fg"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2.5 4.5 L6 8 L9.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1">
            {OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => pick(o.key)}
                className={`rounded-[var(--radius-chip)] border px-2.5 py-1.5 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                  skin === o.key
                    ? "border-accent bg-accent-soft text-accent-ink"
                    : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/95 text-accent-ink shadow-lg shadow-black/20 backdrop-blur"
          aria-label="Open theme switcher"
          title="Theme preview"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}
    </div>
  );
}
