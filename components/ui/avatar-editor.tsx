"use client";

/* ============================================================================
   AvatarEditor, a dependency-free profile-photo editor.
   Crop (drag to reposition), zoom, rotate, and apply a color/B&W filter, then
   export a square PNG via <canvas>. The same transform + CSS filter is applied
   in the live preview and when drawing to the canvas, so what you see is what
   you get. (For a fuller editor you could drop in react-filerobot-image-editor
   or react-easy-crop; this keeps the static export free of extra deps.)
   ============================================================================ */

import { useEffect, useRef, useState } from "react";

// Filter presets → CSS filter strings (also valid for canvas ctx.filter).
const FILTERS: { key: string; css: string }[] = [
  { key: "Original", css: "" },
  { key: "B&W", css: "grayscale(1)" },
  { key: "Sepia", css: "sepia(0.7)" },
  { key: "Warm", css: "saturate(1.35) sepia(0.25)" },
  { key: "Cool", css: "saturate(1.2) hue-rotate(25deg)" },
  { key: "Vivid", css: "saturate(1.7) contrast(1.1)" },
  { key: "Contrast", css: "contrast(1.4)" },
  { key: "Invert", css: "invert(1)" },
];

// Editor + export resolution (square).
const D = 256;

export function AvatarEditor({ src, onCancel, onSave }: { src: string; onCancel: () => void; onSave: (dataUrl: string) => void }) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [filter, setFilter] = useState("");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Load the picked image to learn its natural size.
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      imgRef.current = im;
      setNat({ w: im.naturalWidth, h: im.naturalHeight });
    };
    im.src = src;
  }, [src]);

  // "cover" the box at zoom = 1, then multiply by the zoom slider.
  const coverScale = nat ? Math.max(D / nat.w, D / nat.h) : 1;
  const s = coverScale * zoom;

  // Drag-to-reposition (window listeners so dragging can leave the box).
  useEffect(() => {
    function move(e: MouseEvent) {
      if (!drag.current) return;
      setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
    }
    function up() {
      drag.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, []);
  function down(e: React.MouseEvent) {
    drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  }

  // Draw the same transform + filter to a canvas and hand back a PNG data URL.
  function save() {
    const im = imgRef.current;
    if (!im || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = D;
    canvas.height = D;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, D, D);
    ctx.filter = filter || "none";
    ctx.translate(D / 2 + offset.x, D / 2 + offset.y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(s, s);
    ctx.drawImage(im, -nat.w / 2, -nat.h / 2, nat.w, nat.h);
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Edit photo</h3>
        <p className="mt-1 text-xs text-dim">Drag to reposition · zoom, rotate, and filter.</p>

        {/* circular crop preview */}
        <div
          onMouseDown={down}
          className="relative mx-auto mt-4 cursor-grab overflow-hidden rounded-full border border-line-strong bg-black active:cursor-grabbing"
          style={{ width: D, height: D }}
        >
          {nat && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none max-w-none select-none"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: nat.w,
                height: nat.h,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rot}deg) scale(${s})`,
                transformOrigin: "center",
                filter: filter || "none",
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/20" />
        </div>

        {/* zoom */}
        <label className="mt-4 block text-xs uppercase tracking-[0.06em] text-muted">Zoom</label>
        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[var(--c-accent)]" />

        {/* rotate */}
        <div className="mt-2 flex items-center gap-3">
          <label className="shrink-0 text-xs uppercase tracking-[0.06em] text-muted">Rotate</label>
          <input type="range" min={0} max={360} step={1} value={rot} onChange={(e) => setRot(Number(e.target.value))} className="flex-1 accent-[var(--c-accent)]" />
          <button onClick={() => setRot((r) => (r + 90) % 360)} className="rounded-none border border-hairline-strong px-2 py-1 text-xs text-fg transition-colors hover:bg-hover">
            90°
          </button>
        </div>

        {/* filters */}
        <label className="mt-3 block text-xs uppercase tracking-[0.06em] text-muted">Filter</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.css)}
              className={`rounded-none border px-2.5 py-1 text-xs transition-colors ${
                filter === f.css ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
              }`}
            >
              {f.key}
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={save} className="flex-1 rounded-none bg-accent px-4 py-2.5 text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover">
            Save photo
          </button>
          <button onClick={onCancel} className="rounded-none border border-hairline-strong px-4 py-2.5 text-sm text-fg transition-colors hover:bg-hover">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
