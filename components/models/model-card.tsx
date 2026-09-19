"use client";

import { money } from "@/lib/rate-card";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Model } from "@/lib/models";
import { isFavorite, toggleFavorite, isAutoplay } from "@/lib/prefs";
import { PreviewBadge } from "@/components/models/preview-badge";
import { ModelPoster } from "@/components/models/model-poster";
import { Heart } from "lucide-react";

export function ModelCard({ model, highlight }: { model: Model; highlight?: Set<string> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setFav(isFavorite(model.slug));
  }, [model.slug]);

  function play() {
    if (isAutoplay()) videoRef.current?.play().catch(() => {});
  }
  function stop() {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  const maxRes = model.resolutions[model.resolutions.length - 1];

  return (
    <Link
      href={`/generate?model=${model.slug}`}
      onMouseEnter={play}
      onMouseLeave={stop}
      className="group flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]"
    >
      {/* Media. A model we have no sample for yet - an unreleased one, usually -
          falls back to its own colour rather than to a black rectangle and a
          skeleton that shimmers for ever waiting for a clip that 404s. */}
      <div className="relative aspect-video overflow-hidden">
        {missing ? (
          <ModelPoster slug={model.slug} name={model.name} src={model.poster} className="absolute inset-0" />
        ) : (
          <>
            {!loaded && <span aria-hidden="true" className="skeleton absolute inset-0" />}
            <video
              ref={videoRef}
              onLoadedData={() => setLoaded(true)}
              onError={() => setMissing(true)}
              className="h-full w-full bg-black object-cover opacity-95 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
              src={model.demoVideo}
              poster={model.poster}
              muted
              loop
              playsInline
              preload="auto"
            />
          </>
        )}
        {/* max-res chip, and - for an unpublished model this account was let in
            on - a note that nobody else can see this card at all. */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="rounded-full bg-black/50 px-2.5 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-white/90 backdrop-blur">
            {maxRes}
          </span>
          {model.preview && <PreviewBadge />}
        </div>
        <button
          type="button"
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFav(toggleFavorite(model.slug));
          }}
          className="hit absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-colors hover:bg-black/70"
        >
          <Heart size={16} strokeWidth={2} fill={fav ? "var(--c-heart)" : "none"} color={fav ? "var(--c-heart)" : "var(--c-heart-idle)"} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-[family-name:var(--font-jetbrains)] text-base font-medium uppercase tracking-[0.02em] text-fg-strong transition-colors group-hover:text-gold-soft">
            {model.name}
          </h3>
          <span className="shrink-0 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-gold">
            {model.tagline}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{model.description}</p>

        {/* Capability chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {model.capabilities.map((c) => {
            const on = highlight?.has(c);
            return (
              <span
                key={c}
                className={`rounded-full border px-2.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] transition-colors ${
                  on ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong bg-raised text-fg-soft"
                }`}
              >
                {c}
              </span>
            );
          })}
        </div>

        {/* Spec footer */}
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.05em]">
          <span className="text-dim">{model.durations[0]}–{model.durations[model.durations.length - 1]}s</span>
          <span className="text-fg-soft">
            <span className="text-gold-bright">{money(model.usdPerSecond)}</span> / s
          </span>
        </div>
      </div>
    </Link>
  );
}
