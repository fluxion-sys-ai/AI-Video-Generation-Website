"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Heart, GripHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiDocs } from "@/components/api-docs";
import { SiteFooter } from "@/components/site-footer";
import { getModels, getModel, type Model } from "@/lib/models";
import { isSignedIn, saveDraft, loadDraft, clearDraft } from "@/lib/auth";
import { addRecent, takePendingImages, addLibraryImages, isFavorite, toggleFavorite, getSettings } from "@/lib/prefs";
import { useEscapeKey } from "@/lib/use-escape-key";
import { generateVideo, refineVideo } from "@/lib/api";
import { hasPaymentMethod } from "@/lib/billing";
import { addGeneration } from "@/lib/generations";
import { toast } from "@/lib/toast";

type Status = "idle" | "generating" | "complete" | "failed";

type Draft = {
  slug: string;
  aspect: string;
  resolution: string;
  duration: number;
  audio: boolean;
  prompt: string;
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.06em] text-fg-soft">{label}</label>
        {hint && <span className="text-xs text-dim">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// form controls use the body theme font (Geist), not the browser default.
// Solid, higher-contrast borders + inner surface so inputs read clearly.
const selectClass =
  "w-full rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue";

// content-width dropdown for short values (aspect ratio, resolution, duration).
// Square corners + custom caret via `pg-select` (see app/globals.css).
const compactSelect =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue pg-select";
// same look but for a plain <input> (no dropdown caret / appearance:none)
const compactInput =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue";

// common use for each aspect ratio, shown in the dropdown
const ASPECT_USE: Record<string, string> = {
  "16:9": "YouTube",
  "9:16": "Reels / TikTok",
  "1:1": "Instagram post",
  "4:3": "Camera",
  "3:4": "Instagram portrait",
  "21:9": "Cinema",
};

function GenerateInner() {
  const router = useRouter();
  const params = useSearchParams();
  // No ?model → use the saved default model (Settings), else the first model.
  const slug = params.get("model") || getSettings().defaultModel || "aurora";
  const model: Model = getModel(slug) || getModels()[0];
  // Prefer the saved default resolution when this model supports it.
  const preferredRes = () => {
    const d = getSettings().defaultResolution;
    return model.resolutions.includes(d) ? d : model.popularResolutions[0] || model.resolutions[0];
  };

  const [aspect, setAspect] = useState(model.aspectRatios[0]);
  const [resolution, setResolution] = useState(preferredRes);
  const [duration, setDuration] = useState(model.durations[0]);
  // Raw text for the duration input, so typing "10" isn't coerced mid-entry
  // (which caused the caret to jump / digits to reorder). Clamped on blur.
  const [durationStr, setDurationStr] = useState(String(model.durations[0]));
  const [audio, setAudio] = useState(false);
  const [prompt, setPrompt] = useState("");
  // Uploaded reference images (multiple). Each holds an object URL for the
  // thumbnail preview + the file name. Mock only — nothing is sent anywhere.
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  // Ref mirror so the unmount cleanup can revoke every object URL.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((im) => URL.revokeObjectURL(im.url)), []);

  function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    // Read as data URLs so the upload also persists into the library (tagged
    // with this model) and shows up under /library.
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        setImages((prev) => [...prev, { url: src, name: f.name }]);
        addLibraryImages([{ id: `u${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src, name: f.name, model: slug, size: f.size, uses: 0, addedAt: Date.now() }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = ""; // let the same file be picked again later
  }
  function removeImage(idx: number) {
    setImages((prev) => {
      const t = prev[idx];
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((_, i) => i !== idx);
    });
  }
  // Expanded image viewer (click a thumbnail to open, × / Esc to close).
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  useEscapeKey(() => setLightbox(null));

  // Favorite (heart) for the current model — shared with the model catalog.
  const [fav, setFav] = useState(false);
  useEffect(() => setFav(isFavorite(slug)), [slug]);

  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"examples" | "change">("examples");
  const [view, setView] = useState<"playground" | "api">("playground");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  // Bumped on every run/reset so a stale in-flight generation can't overwrite
  // state after the user has moved on (replaces the old setTimeout handle).
  const genId = useRef(0);

  // Refine session: appears automatically after the first generation.
  const [session, setSession] = useState(false);
  const [chat, setChat] = useState<string[]>([]);
  const [refineInput, setRefineInput] = useState("");

  // Draggable floating refine bar: offset (px) from its default bottom-center
  // spot. Drag the header grip to move it out of the way.
  const [refinePos, setRefinePos] = useState({ x: 0, y: 0 });
  const refineDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    function move(e: PointerEvent) {
      const d = refineDrag.current;
      if (!d) return;
      e.preventDefault();
      setRefinePos({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
    }
    function up() { refineDrag.current = null; }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  function startRefineDrag(e: React.PointerEvent) {
    // Don't start a drag when pressing the header buttons (Undo/Restart).
    if ((e.target as HTMLElement).closest("button")) return;
    refineDrag.current = { sx: e.clientX, sy: e.clientY, ox: refinePos.x, oy: refinePos.y };
  }

  // Reset model-dependent options when the selected model changes.
  // Track recently-used models for the dashboard.
  useEffect(() => {
    addRecent(slug);
  }, [slug]);

  // Keep the prompt, but drop any generated video / refine session.
  useEffect(() => {
    setAspect(model.aspectRatios[0]);
    setResolution(preferredRes());
    setDuration(model.durations[0]);
    setDurationStr(String(model.durations[0]));
    if (!model.supports.audio) setAudio(false);
    setStatus("idle");
    setResultUrl(null);
    setSession(false);
    setChat([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Pick up images handed off from the library ("upload to this model"), if any.
  // Runs per model so it works whether the page mounts fresh or just re-routes.
  useEffect(() => {
    const pending = takePendingImages();
    if (pending.length) setImages(pending);
  }, [slug]);

  // Restore a saved draft after a sign-in detour, then clear it.
  useEffect(() => {
    const d = loadDraft<Draft>();
    if (d && d.slug === slug) {
      setAspect(d.aspect);
      setResolution(d.resolution);
      setDuration(d.duration);
      setDurationStr(String(d.duration));
      setAudio(d.audio);
      setPrompt(d.prompt);
      clearDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ignore any in-flight generation once the component unmounts.
  useEffect(() => () => { genId.current++; }, []);

  function draft(): Draft {
    return { slug, aspect, resolution, duration, audio, prompt };
  }

  function onGenerate() {
    // Gate 1: must be signed in (save the form so sign-in doesn't lose it).
    if (!isSignedIn()) {
      saveDraft(draft());
      router.push(`/login?next=${encodeURIComponent(`/generate?model=${slug}`)}`);
      return;
    }
    // Gate 2: must have a payment method on file.
    if (!hasPaymentMethod()) {
      toast("Add a payment method to start generating.");
      router.push("/profile?tab=payment");
      return;
    }
    const id = ++genId.current;
    setResultUrl(null);
    setStatus("generating");
    generateVideo({ slug, prompt, aspect, resolution, duration, audio, images: images.map((i) => i.url) })
      .then((r) => {
        if (id !== genId.current) return; // superseded — drop the result
        setResultUrl(r.videoUrl);
        setStatus("complete");
        setSession(true);
        // Record it so it shows up in the Library + Profile history.
        addGeneration({ slug, prompt, videoUrl: r.videoUrl, poster: model.poster });
      })
      .catch(() => {
        if (id === genId.current) setStatus("failed");
      });
  }

  // Re-generate from the current prompt + all refinements (the latest edits
  // applied on top of the last result).
  function regen() {
    const id = ++genId.current;
    setResultUrl(null);
    setStatus("generating");
    refineVideo({ slug, prompt, aspect, resolution, duration, audio, images: images.map((i) => i.url) }, chat)
      .then((r) => {
        if (id !== genId.current) return;
        setResultUrl(r.videoUrl);
        setStatus("complete");
        setSession(true);
      })
      .catch(() => {
        if (id === genId.current) setStatus("failed");
      });
  }
  function sendRefine() {
    const text = refineInput.trim();
    if (!text) return;
    setChat((c) => [...c, text]);
    setRefineInput("");
    regen();
  }
  function undoRefine() {
    setChat((c) => c.slice(0, -1));
    regen();
  }
  function restartRefine() {
    setChat([]);
    regen();
  }

  // Real download: fetch the result and save it as a file (works for the mock
  // clip, which is same-origin). WebM/GIF aren't produced in this demo.
  async function downloadResult() {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fluxion-video.mp4";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = "fluxion-video.mp4";
      a.click();
    }
  }

  const [aw, ah] = aspect.split(":").map(Number);
  const portrait = ah > aw;

  return (
    <div className="px-6 py-6">
      {/* Top bar: model picker + Playground/API tabs, side by side. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="pg-modelpick relative w-full max-w-[210px]">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex w-full items-center justify-between gap-3 border border-line-strong bg-raised px-3 py-2.5 text-left transition-colors hover:border-blue"
          >
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-dim">Model</span>
              <span className="block truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{model.name}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`shrink-0 transition-transform ${pickerOpen ? "rotate-180" : ""}`}>
              <path d="M3 6 L8 11 L13 6" stroke="var(--c-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {pickerOpen && (
            <div className="absolute left-0 right-0 z-30 mt-1 border border-line-strong bg-panel p-2 shadow-xl shadow-black/40">
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search models"
                  className="w-full border border-line-strong bg-raised py-2 pl-8 pr-2 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
                />
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto">
                {(() => {
                  const q = pickerQuery.trim().toLowerCase();
                  const list = q
                    ? getModels().filter((m) => [m.name, m.tagline, m.description, ...m.capabilities].join(" ").toLowerCase().includes(q))
                    : getModels();
                  if (list.length === 0) return <p className="p-3 text-sm text-dim">No models match &ldquo;{pickerQuery}&rdquo;.</p>;
                  return list.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => {
                        setPickerOpen(false);
                        setPickerQuery("");
                        router.push(`/generate?model=${m.slug}`);
                      }}
                      className={`flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-hover ${m.slug === slug ? "bg-[rgba(255,138,30,0.08)]" : ""}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent-ink">
                        {m.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{m.name}</span>
                        <span className="block truncate text-xs text-dim">{m.tagline}</span>
                      </span>
                      {m.slug === slug && <span className="shrink-0 text-xs text-accent-ink">✓</span>}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
      </div>
      {/* Playground / API tabs — top bar beside the model picker. */}
      <nav className="pg-viewnav flex gap-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em]">
        {(["playground", "api"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-none px-3 py-2 text-left transition-colors ${
              view === v ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-fg"
            }`}
          >
            {v === "playground" ? "Playground" : "API"}
          </button>
        ))}
      </nav>
      </div>

      <div className="pg-body lg:h-[calc(100vh-7rem)]">
      {view === "api" ? (
        <div className="min-h-0 lg:overflow-y-auto">
          <ApiDocs model={model} />
        </div>
      ) : (
      <div
        className={`pg-grid grid gap-8 transition-[grid-template-columns] duration-300 lg:h-full ${
          panelOpen ? "lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,40%)]" : "lg:grid-cols-[40px_minmax(0,1fr)_minmax(0,40%)]"
        }`}
      >
      {/* Collapsible left panel */}
      <aside className="pg-examples min-h-0">
        {panelOpen ? (
          <div className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto border-r border-line pr-5">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex gap-5 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
                  <button
                    onClick={() => setTab("examples")}
                    className={`pb-1 transition-colors ${tab === "examples" ? "text-gold-soft" : "text-muted hover:text-fg"}`}
                  >
                    Examples
                  </button>
                </div>
                <button onClick={() => setPanelOpen(false)} aria-label="Collapse panel" className="shrink-0 text-muted hover:text-accent-ink">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3 L5 8 L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div>
                <video
                  className="aspect-video w-full rounded-[10px] bg-black object-cover"
                  src={model.demoVideo}
                  poster={model.poster}
                  autoPlay
                  muted
                  loop
                  controls
                  playsInline
                  preload="auto"
                />
                <p className="mt-2 text-xs text-dim">Sample output from {model.name}.</p>
              </div>
            </div>
          </div>
        ) : (
          // Chic pull-tab to reopen the Examples panel: a caret arrow above a
          // slim vertical line; both accent on hover.
          <button
            onClick={() => setPanelOpen(true)}
            aria-label="Show examples"
            title="Examples"
            className="group flex h-full flex-col items-center gap-2 pt-1 text-muted transition-colors hover:text-accent-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3 L11 8 L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="h-16 w-px rounded-full bg-line transition-colors group-hover:bg-accent" />
          </button>
        )}
      </aside>

      {/* Main form (borderless, compact) */}
      <main className="pg-form min-h-0 lg:overflow-y-auto">
        <div className="flex items-center gap-2.5">
          <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">{model.name}</h1>
          <button
            type="button"
            onClick={() => setFav(toggleFavorite(slug))}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            title={fav ? "Remove from favorites" : "Add to favorites"}
            className="shrink-0 text-fg transition-transform hover:scale-110"
          >
            <Heart size={20} strokeWidth={2} fill={fav ? "var(--c-accent)" : "none"} color={fav ? "var(--c-accent)" : "currentColor"} />
          </button>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted">{model.description}</p>

        <div className="mt-5 space-y-4">
          <Field label="Prompt" hint={`${prompt.length} chars`}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe the shot: subject, motion, camera, lighting."
              className={`${selectClass} resize-none pg-prompt`}
            />
          </Field>

          {/* Always available: attach/browse reference images (and show any
              handed over from the library), regardless of the model. */}
          {(
            <Field label="Images" hint="Optional">
              {images.length === 0 ? (
                <label className="flex w-fit cursor-pointer items-center gap-3 rounded-none border border-dashed border-line-strong px-3 py-2 text-sm text-fg-soft hover:border-blue">
                  <span>Choose images</span>
                  <span className="text-blue">Browse</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
                </label>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  {images.map((img, i) => (
                    // Thumbnails keep the image's true aspect ratio (object-contain),
                    // sized by height. Click to expand into the lightbox.
                    <div key={i} className="group relative h-36 overflow-hidden rounded-none border border-line-strong bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        title={img.name}
                        onClick={() => setLightbox(img)}
                        className="h-36 w-auto max-w-[320px] cursor-zoom-in object-contain"
                      />
                      {/* hover: shade the thumbnail (visual only) */}
                      <div className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100" />
                      {/* hover: centered trash button → deletes this image */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        aria-label={`Delete ${img.name}`}
                        title="Delete"
                        className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:bg-danger group-hover:opacity-100"
                      >
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.5M7 7v4M9 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  ))}
                  {/* add-more tile */}
                  <label className="flex h-36 w-36 cursor-pointer items-center justify-center rounded-none border border-dashed border-line-strong text-dim transition-colors hover:border-blue hover:text-blue" title="Add more images">
                    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3 V13 M3 8 H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
                  </label>
                </div>
              )}
            </Field>
          )}

          {/* compact inline controls */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <Field label="Aspect ratio">
              <select value={aspect} onChange={(e) => setAspect(e.target.value)} className={compactSelect}>
                {model.aspectRatios.map((r) => (
                  <option key={r} value={r}>
                    {ASPECT_USE[r] ? `${r} (${ASPECT_USE[r]})` : r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Resolution">
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={compactSelect}>
                {model.resolutions.map((r) => (
                  <option key={r} value={r}>
                    {model.popularResolutions.includes(r) ? `★ ${r}` : r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Duration" hint="3-15 sec">
              <input
                type="number"
                min={3}
                max={15}
                inputMode="numeric"
                value={durationStr}
                onChange={(e) => {
                  const s = e.target.value;
                  setDurationStr(s);
                  const n = Number(s);
                  if (s !== "" && !Number.isNaN(n)) setDuration(n);
                }}
                onBlur={() => {
                  let n = Number(durationStr);
                  if (Number.isNaN(n) || durationStr === "") n = model.durations[0];
                  n = Math.min(15, Math.max(3, Math.round(n)));
                  setDuration(n);
                  setDurationStr(String(n));
                }}
                className={`${compactInput} w-20`}
              />
            </Field>

            {model.supports.audio && (
              <Field label="Audio">
                <button
                  type="button"
                  role="switch"
                  aria-checked={audio}
                  onClick={() => setAudio((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${audio ? "bg-accent" : "bg-track"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </Field>
            )}
          </div>

          <button
            onClick={onGenerate}
            disabled={status === "generating"}
            className="w-full rounded-none bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "generating" ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Refine session UI lives in a floating chatbot bar (see below). */}
      </main>

      {/* Preview stage (right): the chosen aspect shape; the video generates here */}
      <section className="pg-preview flex min-h-0 flex-col gap-3">
        <div className="flex flex-1 flex-col items-center justify-start gap-2">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">
          Preview
        </span>
        <div
          className="relative overflow-hidden rounded-none border border-line-strong bg-black"
          style={portrait ? { aspectRatio: `${aw} / ${ah}`, height: "min(72vh, 640px)" } : { aspectRatio: `${aw} / ${ah}`, width: "100%", maxWidth: 680 }}
        >
          {status === "complete" && resultUrl ? (
            <video className="h-full w-full object-contain" src={resultUrl} controls autoPlay muted loop playsInline />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {status === "generating" ? (
                <>
                  <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">
                    Hang tight, generating…
                  </p>
                  <div className="h-1 w-40 overflow-hidden rounded-full bg-raised">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
                  </div>
                </>
              ) : status === "failed" ? (
                <p className="text-sm text-white">Generation failed. Try again.</p>
              ) : (
                <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-muted">
                  {aspect}
                </span>
              )}
            </div>
          )}
        </div>
        {status === "complete" && resultUrl && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={downloadResult} className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-hover">
                Download MP4
              </button>
              <button disabled title="Coming soon" className="cursor-not-allowed rounded-none border border-hairline-strong px-4 py-2 text-sm opacity-40">
                WebM
              </button>
              <button disabled title="Coming soon" className="cursor-not-allowed rounded-none border border-hairline-strong px-4 py-2 text-sm opacity-40">
                GIF
              </button>
              <button onClick={regen} className="rounded-none border border-hairline-strong px-4 py-2 text-sm transition-colors hover:bg-hover">
                Regenerate
              </button>
            </div>
            <p className="text-xs text-dim">WebM &amp; GIF export coming soon.</p>
          </div>
        )}
        </div>
      </section>
      </div>
      )}
      </div>

      {/* Floating refine chatbot — fixed to the bottom-center like a chat app. */}
      {session && (
        <div
          className="fixed bottom-5 left-1/2 z-[60] w-[min(92vw,640px)] rounded-[14px] border border-line bg-panel/95 p-3 shadow-xl shadow-black/40 backdrop-blur"
          style={{ transform: `translate(calc(-50% + ${refinePos.x}px), ${refinePos.y}px)` }}
        >
          {/* whole header is the drag handle (buttons excluded) */}
          <div
            onPointerDown={startRefineDrag}
            title="Drag to move"
            className="mb-2 flex cursor-move touch-none select-none items-center justify-between px-1"
          >
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
              <GripHorizontal size={14} className="text-dim" />
              Refine session
            </span>
            <div className="flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-xs">
              <button onClick={undoRefine} disabled={chat.length === 0} className="cursor-pointer text-muted hover:text-fg disabled:opacity-40">Undo</button>
              <button onClick={restartRefine} className="cursor-pointer text-muted hover:text-fg">Restart</button>
            </div>
          </div>

          {chat.length > 0 && (
            <div className="mb-2 max-h-32 space-y-2 overflow-y-auto px-1">
              {chat.map((m, i) => (
                <div key={i} className="ml-auto max-w-[85%] rounded-[8px] bg-blue-chip px-3 py-1.5 text-sm text-fg">
                  {m}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendRefine(); }}
              placeholder="Add an edit and press Enter…  (e.g. “make it slower”, “add rain”)"
              className="flex-1 rounded-none border border-line-strong bg-raised px-3 py-2.5 text-sm text-fg outline-none focus:border-blue"
            />
            <button
              onClick={sendRefine}
              disabled={status === "generating" || !refineInput.trim()}
              className="rounded-none bg-accent px-4 py-2 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Expanded image viewer */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-8" onClick={() => setLightbox(null)}>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-black/50 text-white transition-colors hover:bg-danger"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <GenerateInner />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
