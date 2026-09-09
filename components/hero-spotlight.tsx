"use client";

import { useEffect, useRef } from "react";

// A soft glow that follows the cursor across the hero, revealing the line art.
export function HeroSpotlight() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const dot = dotRef.current;
    const host = wrap?.parentElement;
    if (!wrap || !dot || !host) return;

    const move = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      dot.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      wrap.style.opacity = "1";
    };
    const leave = () => {
      wrap.style.opacity = "0";
    };

    host.addEventListener("mousemove", move);
    host.addEventListener("mouseleave", leave);
    return () => {
      host.removeEventListener("mousemove", move);
      host.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
    >
      <div
        ref={dotRef}
        className="absolute -left-[280px] -top-[280px] h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,138,30,0.16), rgba(124,189,242,0.06) 40%, transparent 68%)" }}
      />
    </div>
  );
}
