"use client";

import { useEffect, useRef, useState } from "react";

const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";

type Slot = { a: string; b: string; startMs: number; holdMs: number };

// Each slot cycles A -> B -> A ... always swiping UP, on its own timing.
const SLOTS: Slot[] = [
  { a: `${BASE}/reels/slot1/a.mp4`, b: `${BASE}/reels/slot1/b.mp4`, startMs: 0, holdMs: 5000 },
  { a: `${BASE}/reels/slot2/a.mp4`, b: `${BASE}/reels/slot2/b.mp4`, startMs: 1000, holdMs: 4000 },
  { a: `${BASE}/reels/slot3/a.mp4`, b: `${BASE}/reels/slot3/b.mp4`, startMs: 2000, holdMs: 4500 },
];

function ReelSlot({ slot }: { slot: Slot }) {
  // pos 0 = A, 1 = B, 2 = A(dup). Advancing always moves up; wrap 2->0 is a
  // seamless snap (both are A), then it swipes up to B again.
  const [pos, setPos] = useState(0);
  const [anim, setAnim] = useState(true);
  const posRef = useRef(0);

  useEffect(() => {
    let hold: ReturnType<typeof setTimeout>;
    let mounted = true;

    const step = () => {
      const cur = posRef.current;
      if (cur < 2) {
        posRef.current = cur + 1;
        setAnim(true);
        setPos(posRef.current);
        hold = setTimeout(step, slot.holdMs);
      } else {
        // seamless wrap: snap back to A (no animation), then swipe up to B
        setAnim(false);
        posRef.current = 0;
        setPos(0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!mounted) return;
            setAnim(true);
            posRef.current = 1;
            setPos(1);
            hold = setTimeout(step, slot.holdMs);
          })
        );
      }
    };

    const start = setTimeout(step, slot.startMs + slot.holdMs);
    return () => {
      mounted = false;
      clearTimeout(start);
      clearTimeout(hold);
    };
  }, [slot.startMs, slot.holdMs]);

  const track = [slot.a, slot.b, slot.a];

  return (
    <div className="relative aspect-[9/16] w-[150px] overflow-hidden bg-black">
      <div
        className="absolute inset-0"
        style={{
          height: "300%",
          transform: `translateY(-${pos * 100}%)`,
          transition: anim ? "transform 0.6s cubic-bezier(0.7, 0, 0.3, 1)" : "none",
        }}
      >
        {track.map((src, i) => (
          <video
            key={i}
            src={src}
            className="h-1/3 w-full object-cover"
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
        <ReelSlot key={i} slot={slot} />
      ))}
    </div>
  );
}
