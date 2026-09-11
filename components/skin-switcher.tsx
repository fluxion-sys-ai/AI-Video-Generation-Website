"use client";

// TEMP, draggable floating skin switcher so all site themes can be compared
// across the real pages. Drag it by its header to move it out of the way.
// Persists via lib/prefs (fluxion.skin), applied to <html> before paint by the
// boot script in app/layout.tsx. Remove once a direction is chosen.

import { useEffect, useRef, useState } from "react";
import { getSkin, applySkin, type Skin } from "@/lib/prefs";

const OPTIONS: { key: Skin; label: string }[] = [
  { key: "og", label: "OG" },
  { key: "editorial", label: "Editorial" },
  { key: "luxury", label: "Luxury" },
  { key: "playful", label: "Playful" },
];

export function SkinSwitcher() {
  const [skin, setSkin] = useState<Skin>("og");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSkin(getSkin());
    // Default position: right-middle-ish, clamped to the viewport.
    const w = 210;
    setPos({ x: Math.max(12, window.innerWidth - w - 16), y: Math.max(12, window.innerHeight / 2 - 90) });
    setMounted(true);
  }, []);

  useEffect(() => {
    function move(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      e.preventDefault();
      const el = boxRef.current;
      const w = el?.offsetWidth ?? 210;
      const h = el?.offsetHeight ?? 120;
      const x = Math.min(Math.max(4, e.clientX - d.dx), window.innerWidth - w - 4);
      const y = Math.min(Math.max(4, e.clientY - d.dy), window.innerHeight - h - 4);
      setPos({ x, y });
    }
    function up() { drag.current = null; }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  function startDrag(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return; // don't drag when hitting a control
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
  }

  function pick(s: Skin) {
    applySkin(s);
    setSkin(s);
  }

  if (!mounted) return null;

  return (
    <div ref={boxRef} className="fixed z-[80] print:hidden" style={{ left: pos.x, top: pos.y }}>
      {open ? (
        <div className="flex flex-col gap-1.5 rounded-[var(--radius-control)] border border-line bg-panel/95 p-2 shadow-lg shadow-black/20 backdrop-blur">
          {/* drag handle */}
          <div onPointerDown={startDrag} className="flex cursor-grab items-center justify-between gap-3 px-1 active:cursor-grabbing select-none">
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.14em] text-accent-ink">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><circle cx="2" cy="2" r="1" /><circle cx="5" cy="2" r="1" /><circle cx="8" cy="2" r="1" /><circle cx="2" cy="5" r="1" /><circle cx="5" cy="5" r="1" /><circle cx="8" cy="5" r="1" /></svg>
              Theme preview
            </span>
            <button onClick={() => setOpen(false)} aria-label="Collapse theme switcher" className="hit text-dim transition-colors hover:text-fg">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4.5 L6 8 L9.5 4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => pick(o.key)}
                className={`rounded-[var(--radius-chip)] border px-2.5 py-1.5 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] transition-colors ${
                  skin === o.key ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/95 text-accent-ink shadow-lg shadow-black/20 backdrop-blur" aria-label="Open theme switcher" title="Theme preview">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6" /><path d="M8 2 A6 6 0 0 1 8 14 Z" fill="currentColor" stroke="none" /></svg>
        </button>
      )}
    </div>
  );
}
