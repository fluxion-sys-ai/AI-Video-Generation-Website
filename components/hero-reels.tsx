"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";

const SLOTS = [
  ["a", "b", "c"].map((v) => `${BASE}/reels/slot1/${v}.mp4`),
  ["a", "b", "c"].map((v) => `${BASE}/reels/slot2/${v}.mp4`),
  ["a", "b", "c"].map((v) => `${BASE}/reels/slot3/${v}.mp4`),
];

// One shared scheduler advances a single slot per tick (round-robin), so no
// two slots ever swipe at the same time. Each slot swipes every SLOTS*GAP ms.
const GAP = 1700;

export function HeroReels() {
  const posRef = useRef<number[]>(SLOTS.map(() => 0));
  const animRef = useRef<boolean[]>(SLOTS.map(() => true));
  const [, force] = useState(0);
  const render = () => force((x) => x + 1);

  useEffect(() => {
    const order = [1, 0, 2]; // middle scrolls first, then left, then right
    let turn = 0;
    let mounted = true;
    const id = setInterval(() => {
      const i = order[turn % order.length];
      turn++;
      const n = SLOTS[i].length; // number of real videos
      const cur = posRef.current[i];
      if (cur < n) {
        posRef.current[i] = cur + 1;
        animRef.current[i] = true;
        render();
      } else {
        // showing the duplicate first frame -> snap back (no anim), then swipe up
        posRef.current[i] = 0;
        animRef.current[i] = false;
        render();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!mounted) return;
            posRef.current[i] = 1;
            animRef.current[i] = true;
            render();
          })
        );
      }
    }, GAP);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex overflow-hidden rounded-[14px] border border-[rgba(255,193,94,0.35)] shadow-[0_20px_55px_rgba(0,0,0,0.55),0_0_70px_-8px_rgba(255,193,94,0.55)]">
      {SLOTS.map((videos, i) => {
        const n = videos.length;
        const unit = 100 / (n + 1);
        const track = [...videos, videos[0]];
        return (
          <Fragment key={i}>
            {i > 0 && (
              <div className="relative z-10 w-px self-stretch bg-[rgba(255,193,94,0.7)] shadow-[0_0_16px_4px_rgba(255,193,94,0.55)]" />
            )}
            <div className="relative aspect-[9/16] w-[20vw] overflow-hidden bg-black">
              <div
                className="absolute inset-0"
                style={{
                  height: `${(n + 1) * 100}%`,
                  transform: `translateY(-${posRef.current[i] * unit}%)`,
                  transition: animRef.current[i] ? "transform 0.6s cubic-bezier(0.7, 0, 0.3, 1)" : "none",
                }}
              >
                {track.map((src, j) => (
                  <video
                    key={j}
                    src={src}
                    style={{ height: `${unit}%` }}
                    className="w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                ))}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
