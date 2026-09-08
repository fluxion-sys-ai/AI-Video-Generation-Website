"use client";

import { useEffect, useRef, useState } from "react";

const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";

type Slot = { videos: string[]; startMs: number; holdMs: number };

// Each slot cycles through its videos, always swiping UP, on its own timing.
const SLOTS: Slot[] = [
  { videos: ["a", "b", "c"].map((v) => `${BASE}/reels/slot1/${v}.mp4`), startMs: 0, holdMs: 5000 },
  { videos: ["a", "b", "c"].map((v) => `${BASE}/reels/slot2/${v}.mp4`), startMs: 1000, holdMs: 4000 },
  { videos: ["a", "b", "c"].map((v) => `${BASE}/reels/slot3/${v}.mp4`), startMs: 2000, holdMs: 4500 },
];

function ReelSlot({ videos, startMs, holdMs }: Slot) {
  const n = videos.length;
  const [pos, setPos] = useState(0); // 0..n; position n is a duplicate of the first for a seamless wrap
  const [anim, setAnim] = useState(true);
  const posRef = useRef(0);

  useEffect(() => {
    if (n < 2) return;
    let hold: ReturnType<typeof setTimeout>;
    let mounted = true;

    const step = () => {
      const cur = posRef.current;
      if (cur < n) {
        posRef.current = cur + 1;
        setAnim(true);
        setPos(posRef.current);
        hold = setTimeout(step, holdMs);
      } else {
        // at the duplicate first frame -> snap back to real first (no anim), then swipe up
        setAnim(false);
        posRef.current = 0;
        setPos(0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!mounted) return;
            setAnim(true);
            posRef.current = 1;
            setPos(1);
            hold = setTimeout(step, holdMs);
          })
        );
      }
    };

    const start = setTimeout(step, startMs + holdMs);
    return () => {
      mounted = false;
      clearTimeout(start);
      clearTimeout(hold);
    };
  }, [n, startMs, holdMs]);

  const track = [...videos, videos[0]]; // append first for the seamless wrap
  const unit = 100 / (n + 1); // each frame is this % of the track height

  return (
    <div className="relative aspect-[9/16] w-[150px] overflow-hidden bg-black">
      <div
        className="absolute inset-0"
        style={{
          height: `${(n + 1) * 100}%`,
          transform: `translateY(-${pos * unit}%)`,
          transition: anim ? "transform 0.6s cubic-bezier(0.7, 0, 0.3, 1)" : "none",
        }}
      >
        {track.map((src, i) => (
          <video
            key={i}
            src={src}
            style={{ height: `${unit}%` }}
            className="w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ))}
      </div>
    </div>
  );
}

// Three vertical reels side by side, forming one seamless rect.
export function HeroReels() {
  return (
    <div className="flex overflow-hidden rounded-[14px] border border-[rgba(255,193,94,0.35)] shadow-[0_20px_55px_rgba(0,0,0,0.55),0_0_70px_-8px_rgba(255,193,94,0.55)]">
      {SLOTS.map((slot, i) => (
        <ReelSlot key={i} {...slot} />
      ))}
    </div>
  );
}
