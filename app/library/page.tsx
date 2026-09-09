"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { isSignedIn } from "@/lib/auth";
import { getModels } from "@/lib/models";

export default function LibraryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"videos" | "images">("videos");

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/library");
      return;
    }
    setReady(true);
  }, [router]);

  const models = getModels();
  const prompts = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
    "Timelapse of clouds over a mountain ridge",
    "Macro shot of ink blooming in water",
    "Drone flyover of a foggy pine forest",
  ];
  const videos = prompts.map((p, i) => ({ id: i, prompt: p, model: models[i % models.length], when: ["2h ago", "Yesterday", "3 days ago", "Last week", "Last week", "2 weeks ago"][i] }));
  const images = models.flatMap((m) => [
    { id: `${m.slug}-a`, src: m.poster, name: `${m.slug}-ref-01.jpg` },
    { id: `${m.slug}-b`, src: m.poster, name: `${m.slug}-ref-02.jpg` },
  ]);

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-10 py-10">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Library</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Your library</h1>
        <p className="mt-2 text-sm text-muted">Everything you&apos;ve generated and uploaded.</p>

        <div className="mt-8 flex gap-6 border-b border-[rgba(124,189,242,0.14)] font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
          {(["videos", "images"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 transition-colors ${
                tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "videos" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <Link key={v.id} href={`/generate?model=${v.model.slug}`} className="group border border-line p-3 transition-colors hover:border-[rgba(124,189,242,0.5)]">
                <div className="aspect-video w-full overflow-hidden bg-black">
                  <video src={v.model.demoVideo} poster={v.model.poster} muted loop playsInline className="h-full w-full object-cover" onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
                </div>
                <p className="mt-3 truncate text-sm text-fg">{v.prompt}</p>
                <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-gold">{v.model.name} · {v.when}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === "images" && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img) => (
              <div key={img.id} className="border border-line p-2">
                <div className="aspect-square w-full overflow-hidden bg-black">
                  <img src={img.src} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 truncate font-[family-name:var(--font-jetbrains)] text-[10px] text-dim">{img.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
