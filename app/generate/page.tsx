"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getModels, getModel, type Model } from "@/lib/models";
import { isSignedIn, saveDraft, loadDraft, clearDraft } from "@/lib/auth";

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
        <label className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.06em] text-[#C7D4E6]">{label}</label>
        {hint && <span className="text-xs text-[#7E8FA8]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// form controls use the body theme font (Geist), not the browser default.
// Solid, higher-contrast borders + inner surface so inputs read clearly.
const selectClass =
  "w-full rounded-[8px] border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] font-[family-name:var(--font-geist-sans)] outline-none focus:border-[#7CBDF2] focus:ring-1 focus:ring-[#7CBDF2]";

// content-width control for short values (aspect ratio, resolution, duration)
const compactSelect =
  "rounded-[8px] border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] font-[family-name:var(--font-geist-sans)] outline-none focus:border-[#7CBDF2] focus:ring-1 focus:ring-[#7CBDF2]";

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refine session: chat-style edits that re-generate the video each time.
  const [refine, setRefine] = useState(false);
  const [chat, setChat] = useState<string[]>([]);
  const [refineInput, setRefineInput] = useState("");

  // Reset model-dependent options when the selected model changes.
  useEffect(() => {
    setAspect(model.aspectRatios[0]);
    setResolution(model.popularResolutions[0] || model.resolutions[0]);
    setDuration(model.durations[0]);
    if (!model.supports.audio) setAudio(false);
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
      }
    }, 3500 + Math.random() * 3000);
  }

  // Mock re-generation for the refine session (always succeeds, a bit faster).
  function regen() {
    setResultUrl(null);
    setStatus("generating");
    timer.current = setTimeout(() => {
      setResultUrl(model.demoVideo);
      setStatus("complete");
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

  const credits = model.creditsPerSecond * duration;
  const [aw, ah] = aspect.split(":").map(Number);
  const portrait = ah > aw;

  return (
    <div className="grid gap-8 px-8 py-8 lg:h-[calc(100vh-5rem)] lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,40%)]">
      {/* Sidebar (borderless) */}
      <aside className="min-h-0 space-y-8 lg:overflow-y-auto">
        <div>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#E0A24E]">
            Pricing
          </span>
          <p className="mt-2 text-sm text-[#9FB2CC]">{model.creditsPerSecond} credits / second</p>
          <p className="text-sm text-[#9FB2CC]">
            Estimate: <span className="text-[#E9F1FB]">{credits} credits</span> for {duration}s
          </p>
        </div>

        <div>
          <div className="mb-3 flex gap-5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em]">
            <button
              onClick={() => setTab("examples")}
              className={`pb-1 transition-colors ${tab === "examples" ? "border-b border-[#F5C46B] text-[#F5C46B]" : "text-[#9FB2CC] hover:text-[#E9F1FB]"}`}
            >
              Examples
            </button>
            <button
              onClick={() => setTab("change")}
              className={`pb-1 transition-colors ${tab === "change" ? "border-b border-[#F5C46B] text-[#F5C46B]" : "text-[#9FB2CC] hover:text-[#E9F1FB]"}`}
            >
              Other Models
            </button>
          </div>
          {tab === "examples" ? (
            <div>
              <video
                className="aspect-video w-full rounded-[10px] bg-black object-cover"
                src={model.demoVideo}
                poster={model.poster}
                muted
                loop
                controls
                playsInline
                preload="metadata"
              />
              <p className="mt-2 text-xs text-[#6E82A0]">Sample output from {model.name}.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {getModels().map((m) => (
                <Link
                  key={m.slug}
                  href={`/generate?model=${m.slug}`}
                  className={`block py-1.5 text-sm uppercase tracking-[0.02em] transition-colors hover:text-[#F5C46B] ${m.slug === slug ? "text-[#7CBDF2]" : "text-[#9FB2CC]"}`}
                >
                  {m.name}
                  <span className="block text-xs normal-case tracking-normal text-[#6E82A0]">{m.tagline}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main form (borderless, compact) */}
      <main className="min-h-0 lg:overflow-y-auto">
        <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">{model.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#9FB2CC]">{model.description}</p>

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
              <label className="flex w-fit cursor-pointer items-center gap-3 rounded-[8px] border border-dashed border-[#3E5C87] px-3 py-2 text-sm text-[#C7D4E6] hover:border-[#7CBDF2]">
                <span className="max-w-[220px] truncate">{imageName ?? "Choose an image"}</span>
                <span className="text-[#7CBDF2]">Browse</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)} />
              </label>
            </Field>
          )}

          {/* compact inline controls */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <Field label="Aspect ratio">
              <select value={aspect} onChange={(e) => setAspect(e.target.value)} className={compactSelect}>
                {model.aspectRatios.map((r) => (
                  <option key={r} value={r}>{r}</option>
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
                  className={`relative h-6 w-11 rounded-full transition-colors ${audio ? "bg-[#4EC98F]" : "bg-[#243A57]"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </Field>
            )}
          </div>

          <button
            onClick={onGenerate}
            disabled={status === "generating"}
            className="w-full rounded-[10px] bg-[#FF8A1E] px-6 py-2.5 font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "generating" ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Refine session: chat-style edits that re-generate each time */}
        {refine && (
          <div className="mt-6 space-y-3 rounded-[10px] border border-[#2E466B] bg-[#101E36] p-4">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.08em] text-[#E0A24E]">
                Refine session
              </span>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={undoRefine} disabled={chat.length === 0} className="text-[#9FB2CC] hover:text-[#E9F1FB] disabled:opacity-40">
                  Undo
                </button>
                <button onClick={restartRefine} className="text-[#9FB2CC] hover:text-[#E9F1FB]">
                  Restart
                </button>
                <button onClick={() => setRefine(false)} className="text-[#9FB2CC] hover:text-[#F5C46B]">
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto">
              {chat.length === 0 ? (
                <p className="text-xs text-[#6E82A0]">Add an instruction to tweak the video, e.g. &quot;make it slower&quot; or &quot;add rain&quot;. Each edit re-generates.</p>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className="ml-auto max-w-[85%] rounded-[8px] bg-[rgba(124,189,242,0.12)] px-3 py-1.5 text-sm text-[#E9F1FB]">
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
                className="rounded-[10px] bg-[#FF8A1E] px-4 py-2 text-sm font-medium text-[#0A1322] hover:bg-[#FF9F45] disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Preview stage (right): the chosen aspect shape; the video generates here */}
      <section className="flex min-h-0 flex-col items-center justify-center gap-3">
        <div
          className="relative overflow-hidden rounded-[10px] border border-[#3E5C87] bg-black"
          style={portrait ? { aspectRatio: `${aw} / ${ah}`, height: "min(72vh, 640px)" } : { aspectRatio: `${aw} / ${ah}`, width: "100%", maxWidth: 680 }}
        >
          {status === "complete" && resultUrl ? (
            <video className="h-full w-full object-contain" src={resultUrl} controls autoPlay muted loop playsInline />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {status === "generating" ? (
                <>
                  <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-[#9FB2CC]">
                    Hang tight, generating…
                  </p>
                  <div className="h-1 w-40 overflow-hidden rounded-full bg-[#1D3149]">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-[#FF8A1E]" />
                  </div>
                </>
              ) : status === "failed" ? (
                <p className="text-sm text-[#E9F1FB]">Generation failed. Try again.</p>
              ) : (
                <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#5A6B84]">
                  {aspect} preview
                </span>
              )}
            </div>
          )}
        </div>
        {status === "complete" && resultUrl && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a href={resultUrl} download="fluxion-video.mp4" className="rounded-[10px] bg-[#FF8A1E] px-4 py-2 text-sm font-medium text-[#0A1322] hover:bg-[#FF9F45]">
              Download MP4
            </a>
            <a href={resultUrl} download="fluxion-video.webm" className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-4 py-2 text-sm hover:bg-[rgba(124,189,242,0.06)]">
              WebM
            </a>
            <a href={resultUrl} download="fluxion-video.gif" className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-4 py-2 text-sm hover:bg-[rgba(124,189,242,0.06)]">
              GIF
            </a>
            <button onClick={onGenerate} className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-4 py-2 text-sm hover:bg-[rgba(124,189,242,0.06)]">
              Regenerate
            </button>
            <button
              onClick={() => setRefine(true)}
              className="px-2 text-sm text-[#7CBDF2] hover:text-[#F5C46B]"
            >
              Reprompt
            </button>
          </div>
        )}
      </section>
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
    </div>
  );
}
