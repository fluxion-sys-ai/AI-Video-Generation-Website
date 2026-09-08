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
  description: string;
  aspect: string;
  resolution: string;
  duration: number;
  audio: boolean;
  prompt: string;
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="border-t border-[rgba(124,189,242,0.14)] py-5 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[#E9F1FB]">{label}</label>
        {hint && <span className="text-xs text-[#6E82A0]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const selectClass =
  "w-full rounded-[10px] border border-[rgba(124,189,242,0.2)] bg-[#0E1730] px-3 py-2.5 text-sm outline-none focus:border-[#7CBDF2]";

function GenerateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("model") || "aurora";
  const model: Model = getModel(slug) || getModels()[0];

  const [description, setDescription] = useState("");
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
      setDescription(d.description);
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
    return { slug, description, aspect, resolution, duration, audio, prompt };
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

  const credits = model.creditsPerSecond * duration;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[10px] border border-[rgba(124,189,242,0.14)] p-5">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#6E82A0]">
            Pricing
          </span>
          <p className="mt-2 text-sm text-[#A9BBD4]">
            {model.creditsPerSecond} credits / second
          </p>
          <p className="text-sm text-[#A9BBD4]">
            Estimate: <span className="text-[#E9F1FB]">{credits} credits</span> for {duration}s
          </p>
        </div>

        <div className="mt-4 rounded-[10px] border border-[rgba(124,189,242,0.14)] p-2">
          <div className="mb-1 flex rounded-[8px] bg-[#0E1730] p-1 text-sm">
            <button
              onClick={() => setTab("examples")}
              className={`flex-1 rounded-[6px] px-3 py-1.5 transition-colors ${tab === "examples" ? "bg-[rgba(124,189,242,0.14)] text-[#E9F1FB]" : "text-[#A9BBD4]"}`}
            >
              Examples
            </button>
            <button
              onClick={() => setTab("change")}
              className={`flex-1 rounded-[6px] px-3 py-1.5 transition-colors ${tab === "change" ? "bg-[rgba(124,189,242,0.14)] text-[#E9F1FB]" : "text-[#A9BBD4]"}`}
            >
              Change model
            </button>
          </div>
          {tab === "examples" ? (
            <div className="p-1">
              <video
                className="aspect-video w-full rounded-[8px] bg-black object-cover"
                src={model.demoVideo}
                poster={model.poster}
                muted
                loop
                controls
                playsInline
                preload="metadata"
              />
              <p className="mt-2 px-1 text-xs text-[#6E82A0]">Sample output from {model.name}.</p>
            </div>
          ) : (
            <div className="p-1">
              {getModels().map((m) => (
                <Link
                  key={m.slug}
                  href={`/generate?model=${m.slug}`}
                  className={`block rounded-[6px] px-3 py-2 text-sm transition-colors hover:bg-[rgba(124,189,242,0.08)] ${m.slug === slug ? "text-[#7CBDF2]" : "text-[#A9BBD4]"}`}
                >
                  {m.name}
                  <span className="block text-xs text-[#6E82A0]">{m.tagline}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main form */}
      <main>
        <h1 className="font-[family-name:var(--font-sora)] text-3xl font-medium tracking-[-0.02em]">{model.name}</h1>
        <p className="mt-2 max-w-2xl text-[#A9BBD4]">{model.description}</p>

        <div className="mt-8 rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#0E1730]/50 p-6 backdrop-blur-sm">
          {model.supports.image && (
            <Field label="Upload image" hint="Optional">
              <label className="flex cursor-pointer items-center justify-between rounded-[10px] border border-dashed border-[rgba(124,189,242,0.24)] px-3 py-3 text-sm text-[#A9BBD4] hover:border-[#7CBDF2]">
                <span>{imageName ?? "Choose an image to animate"}</span>
                <span className="text-[#7CBDF2]">Browse</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)} />
              </label>
            </Field>
          )}

          <Field label="Description" hint="What you want to make">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short summary of the scene"
              className={selectClass}
            />
          </Field>

          <Field label="Aspect ratio">
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} className={selectClass}>
              {model.aspectRatios.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="Resolution" hint="★ = popular">
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={selectClass}>
              {model.resolutions.map((r) => (
                <option key={r} value={r}>
                  {model.popularResolutions.includes(r) ? `★ ${r} (popular)` : r}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration" hint="Seconds">
            <input
              type="number"
              min={model.durations[0]}
              max={model.durations[model.durations.length - 1]}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={selectClass}
            />
          </Field>

          {model.supports.audio && (
            <Field label="Audio" hint="Include a soundtrack">
              <button
                type="button"
                role="switch"
                aria-checked={audio}
                onClick={() => setAudio((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${audio ? "bg-[#7CBDF2]" : "bg-[#1D3149]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </Field>
          )}

          <Field label="Prompt" hint={`${prompt.length} chars`}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the shot in detail: subject, motion, camera, lighting."
              className={`${selectClass} resize-y`}
            />
          </Field>

          <div className="border-t border-[rgba(124,189,242,0.14)] pt-5">
            <button
              onClick={onGenerate}
              disabled={status === "generating"}
              className="w-full rounded-[10px] bg-[#7CBDF2] px-6 py-3 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "generating" ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>

        {/* Result / status */}
        {status !== "idle" && (
          <div className="mt-8 rounded-[10px] border border-[rgba(124,189,242,0.14)] p-6">
            {status === "generating" && (
              <div>
                <p className="text-sm text-[#A9BBD4]">Hang tight — generating your video…</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#1D3149]">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-[#7CBDF2]" />
                </div>
              </div>
            )}
            {status === "failed" && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[#E9F1FB]">Generation failed. Try again.</p>
                <button onClick={onGenerate} className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-4 py-2 text-sm hover:bg-[rgba(124,189,242,0.06)]">
                  Retry
                </button>
              </div>
            )}
            {status === "complete" && resultUrl && (
              <div>
                <video className="aspect-video w-full rounded-[8px] bg-black object-contain" src={resultUrl} controls autoPlay muted loop playsInline />
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={resultUrl} download className="rounded-[10px] bg-[#7CBDF2] px-4 py-2 text-sm font-medium text-[#0A1322] hover:bg-[#A6D4F8]">
                    Download
                  </a>
                  <button onClick={onGenerate} className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-4 py-2 text-sm hover:bg-[rgba(124,189,242,0.06)]">
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
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
