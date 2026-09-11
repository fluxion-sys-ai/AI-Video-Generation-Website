"use client";

// Deep-space backdrop for the Cosmos skin only: a layered starfield + a couple
// of abstract nebula planets that drift very slowly and parallax gently with
// scroll. Kept low-opacity so it sets a mood without distracting. Renders
// nothing on other skins. Honors prefers-reduced-motion.

import { useEffect, useState } from "react";
import { useSkin } from "@/lib/use-skin";

export function CosmosBackdrop() {
  const skin = useSkin();
  const [off, setOff] = useState(0);

  useEffect(() => {
    if (skin !== "cosmos") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOff(window.scrollY || 0));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [skin]);

  if (skin !== "cosmos") return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "radial-gradient(120% 120% at 80% -10%, #171246 0%, #0a0820 45%, #060512 100%)" }}>
      {/* nebula planets */}
      <div className="cosmos-planet" style={{ top: "12%", left: "68%", width: 320, height: 320, background: "radial-gradient(circle at 35% 30%, #6ee7ff55, #7c3aed22 55%, transparent 70%)", transform: `translateY(${off * -0.04}px)` }} />
      <div className="cosmos-planet" style={{ top: "58%", left: "8%", width: 240, height: 240, background: "radial-gradient(circle at 40% 35%, #b06bff44, #4de3ff18 55%, transparent 72%)", transform: `translateY(${off * -0.08}px)` }} />
      <div className="cosmos-planet" style={{ top: "80%", left: "82%", width: 160, height: 160, background: "radial-gradient(circle at 40% 35%, #4de3ff33, transparent 70%)", transform: `translateY(${off * -0.06}px)` }} />
      {/* three star layers at different parallax depths */}
      <div className="cosmos-stars cosmos-stars-a" style={{ transform: `translateY(${off * -0.15}px)` }} />
      <div className="cosmos-stars cosmos-stars-b" style={{ transform: `translateY(${off * -0.28}px)` }} />
      <div className="cosmos-stars cosmos-stars-c" style={{ transform: `translateY(${off * -0.42}px)` }} />
    </div>
  );
}
