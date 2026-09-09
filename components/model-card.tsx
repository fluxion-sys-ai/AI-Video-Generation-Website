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
    <Link href={`/generate?model=${model.slug}`} onMouseEnter={play} onMouseLeave={stop} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-[10px] bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-95 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          src={model.demoVideo}
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em] text-[#F4F8FE] transition-colors group-hover:text-[#F5C46B]">
            {model.name}
          </h3>
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-[#E0A24E]">
            {model.tagline}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#9FB2CC]">{model.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {model.capabilities.map((c) => (
            <span
              key={c}
              className="rounded-full border border-[#33507C] bg-[#101E36] px-2.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-[#C7D4E6]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
