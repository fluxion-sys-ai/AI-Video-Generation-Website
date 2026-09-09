"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ApiDocs } from "@/components/api-docs";
import { SiteFooter } from "@/components/site-footer";
import { getModels, getModel, type Model } from "@/lib/models";
import { isSignedIn, saveDraft, loadDraft, clearDraft } from "@/lib/auth";
import { addRecent } from "@/lib/prefs";

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
  "w-full rounded-[8px] border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue";

// content-width dropdown for short values (aspect ratio, resolution, duration).
// Square corners + custom caret via `pg-select` (see app/globals.css).
const compactSelect =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue pg-select";

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
  const slug = params.get("model") || "aurora";
  const model: Model = getModel(slug) || getModels()[0];

  const [aspect, setAspect] = useState(model.aspectRatios[0]);
  const [resolution, setResolution] = useState(model.popularResolutions[0] || model.resolutions[0]);
  const [duration, setDuration] = useState(model.durations[0]);
  const [audio, setAudio] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageName, setImageName] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<"examples" | "change">("examples");
  const [view, setView] = useState<"playground" | "api">("playground");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refine session: appears automatically after the first generation.
  const [session, setSession] = useState(false);
  const [chat, setChat] = useState<string[]>([]);
  const [refineInput, setRefineInput] = useState("");

  // Reset model-dependent options when the selected model changes.
  // Track recently-used models for the dashboard.
  useEffect(() => {
    addRecent(slug);
  }, [slug]);

  // Keep the prompt, but drop any generated video / refine session.
  useEffect(() => {
    setAspect(model.aspectRatios[0]);
    setResolution(model.popularResolutions[0] || model.resolutions[0]);
    setDuration(model.durations[0]);
    if (!model.supports.audio) setAudio(false);
    setStatus("idle");
    setResultUrl(null);
    setSession(false);
    setChat([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Restore a saved draft after a sign-in detour, then clear it.
  useEffect(() => {
    const d = loadDraft<Draft>();
    if (d && d.slug === slug) {
      setAspect(d.aspect);
      setResolution(d.resolution);
      setDuration(d.duration);
      setAudio(d.audio);
      setPrompt(d.prompt);
      clearDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function draft(): Draft {
    return { slug, aspect, resolution, duration, audio, prompt };
  }

  function onGenerate() {
    if (!isSignedIn()) {
      saveDraft(draft());
      router.push(`/login?next=${encodeURIComponent(`/generate?model=${slug}`)}`);
      return;
    }
    setResultUrl(null);
    setStatus("generating");
    timer.current = setTimeout(() => {
      if (Math.random() < 0.12) {
        setStatus("failed");
      } else {
        setResultUrl(model.demoVideo);
        setStatus("complete");
        setSession(true);
      }
    }, 3500 + Math.random() * 3000);
  }

  // Re-generate from the current prompt + all refinements (mock: reuses the model
  // to re-render, i.e. the latest edits applied on top of the last result).
  function regen() {
    setResultUrl(null);
    setStatus("generating");
    timer.current = setTimeout(() => {
      setResultUrl(model.demoVideo);
      setStatus("complete");
      setSession(true);
    }, 2000 + Math.random() * 2000);
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

  const [aw, ah] = aspect.split(":").map(Number);
  const portrait = ah > aw;

  return (
    <div className="px-6 py-6">
      {/* Searchable, closable model-catalog picker */}
      {(
        <div className="relative mb-4 max-w-md">
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
              <path d="M3 6 L8 11 L13 6" stroke="#9FB2CC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent">
                        {m.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{m.name}</span>
                        <span className="block truncate text-xs text-dim">{m.tagline}</span>
                      </span>
                      {m.slug === slug && <span className="shrink-0 text-xs text-accent">✓</span>}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:h-[calc(100vh-7rem)] lg:grid-cols-[150px_1fr]">
      {/* Left rail: Playground / API */}
      <nav className="flex gap-2 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] lg:flex-col lg:gap-1">
        {(["playground", "api"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-[8px] px-3 py-2 text-left transition-colors ${
              view === v ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-fg"
            }`}
          >
            {v === "playground" ? "Playground" : "API"}
          </button>
        ))}
      </nav>

      {view === "api" ? (
        <div className="min-h-0 lg:overflow-y-auto">
          <ApiDocs model={model} />
        </div>
      ) : (
      <div
        className={`grid gap-8 transition-[grid-template-columns] duration-300 lg:h-full ${
          panelOpen ? "lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,40%)]" : "lg:grid-cols-[40px_minmax(0,1fr)_minmax(0,40%)]"
        }`}
      >
      {/* Collapsible left panel */}
      <aside className="min-h-0">
        {panelOpen ? (
          <div className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto rounded-[12px] border border-line bg-panel p-4">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex gap-5 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
                  <button
                    onClick={() => setTab("examples")}
                    className={`pb-1 transition-colors ${tab === "examples" ? "border-b border-gold-soft text-gold-soft" : "text-muted hover:text-fg"}`}
                  >
                    Examples
                  </button>
                </div>
                <button onClick={() => setPanelOpen(false)} aria-label="Collapse panel" className="shrink-0 text-muted hover:text-accent">
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
          <button
            onClick={() => setPanelOpen(true)}
            aria-label="Open panel"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-hover hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3 L11 8 L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </aside>

      {/* Main form (borderless, compact) */}
      <main className="min-h-0 lg:overflow-y-auto">
        <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">{model.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{model.description}</p>

        <div className="mt-5 space-y-4">
          <Field label="Prompt" hint={`${prompt.length} chars`}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe the shot: subject, motion, camera, lighting."
              className={`${selectClass} resize-none`}
            />
          </Field>

          {model.supports.image && (
            <Field label="Image" hint="Optional">
              <label className="flex w-fit cursor-pointer items-center gap-3 rounded-[8px] border border-dashed border-line-strong px-3 py-2 text-sm text-fg-soft hover:border-blue">
                <span className="max-w-[220px] truncate">{imageName ?? "Choose an image"}</span>
                <span className="text-blue">Browse</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)} />
              </label>
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
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={`${compactSelect} w-20`}
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

        {/* Refine session: appears after the first generation; each edit re-generates */}
        {session && (
          <div className="mt-6 space-y-3 rounded-[10px] border border-line bg-raised p-4">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
                Refine session
              </span>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={undoRefine} disabled={chat.length === 0} className="text-muted hover:text-fg disabled:opacity-40">
                  Undo
                </button>
                <button onClick={restartRefine} className="text-muted hover:text-fg">
                  Restart
                </button>
              </div>
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto">
              {chat.length === 0 ? (
                <p className="text-xs text-dim">Add an instruction to tweak the video, e.g. &quot;make it slower&quot; or &quot;add rain&quot;. Each edit re-generates.</p>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className="ml-auto max-w-[85%] rounded-[8px] bg-[rgba(124,189,242,0.12)] px-3 py-1.5 text-sm text-fg">
                    {m}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendRefine(); }}
                placeholder="Add an edit and press Enter…"
                className={`${selectClass} flex-1`}
              />
              <button
                onClick={sendRefine}
                disabled={status === "generating" || !refineInput.trim()}
                className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Preview stage (right): the chosen aspect shape; the video generates here */}
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-1 flex-col items-center justify-start gap-2">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">
          Preview
        </span>
        <div
          className="relative overflow-hidden rounded-[10px] border border-line-strong bg-black"
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
                <p className="text-sm text-fg">Generation failed. Try again.</p>
              ) : (
                <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-muted">
                  {aspect}
                </span>
              )}
            </div>
          )}
        </div>
        {status === "complete" && resultUrl && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href={resultUrl} download="fluxion-video.mp4" className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-hover">
              Download MP4
            </a>
            <a href={resultUrl} download="fluxion-video.webm" className="rounded-[10px] border border-hairline-strong px-4 py-2 text-sm hover:bg-hover">
              WebM
            </a>
            <a href={resultUrl} download="fluxion-video.gif" className="rounded-[10px] border border-hairline-strong px-4 py-2 text-sm hover:bg-hover">
              GIF
            </a>
            <button onClick={regen} className="rounded-[10px] border border-hairline-strong px-4 py-2 text-sm hover:bg-hover">
              Regenerate
            </button>
          </div>
        )}
        </div>
      </section>
      </div>
      )}
      </div>
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
