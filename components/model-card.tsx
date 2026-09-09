"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Model } from "@/lib/models";
import { isFavorite, toggleFavorite } from "@/lib/prefs";

export function ModelCard({ model }: { model: Model }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(model.slug));
  }, [model.slug]);

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
        <button
          type="button"
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFav(toggleFavorite(model.slug));
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-colors hover:bg-black/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "#FF8A1E" : "none"} stroke={fav ? "#FF8A1E" : "#E9F1FB"} strokeWidth="2">
            <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" strokeLinejoin="round" />
          </svg>
        </button>
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
