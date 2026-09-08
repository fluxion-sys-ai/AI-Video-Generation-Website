"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Model } from "@/lib/models";

export function ModelCard({ model }: { model: Model }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function play() {
    videoRef.current?.play().catch(() => {});
  }
  function stop() {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }

  return (
    <Link
      href={`/generate?model=${model.slug}`}
      onMouseEnter={play}
      onMouseLeave={stop}
      className="group block overflow-hidden rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#0E1730] transition-colors hover:border-[rgba(124,189,242,0.35)]"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          src={model.demoVideo}
          poster={model.poster}
          muted
          loop
          playsInline
          preload="metadata"
        />
        <span className="absolute left-3 top-3 rounded-[6px] border border-[rgba(148,170,200,0.3)] bg-black/40 px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.08em] text-[#A9BBD4] backdrop-blur">
          Demo
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-[family-name:var(--font-sora)] text-lg font-medium uppercase tracking-[0.01em] text-[#E9F1FB]">{model.name}</h3>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#6E82A0]">{model.tagline}</span>
        </div>
        <p className="mt-2 text-sm text-[#A9BBD4]">{model.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {model.capabilities.map((c) => (
            <span key={c} className="rounded-full border border-[rgba(124,189,242,0.18)] px-2.5 py-0.5 text-xs text-[#A9BBD4]">
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
