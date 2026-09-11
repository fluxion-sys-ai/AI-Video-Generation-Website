"use client";

// Airy light backdrop for the Slideshow skin only: a soft lavender gradient with
// a few slowly-drifting pastel blobs that parallax gently with scroll. Kept very
// subtle. Renders nothing on other skins. Honors prefers-reduced-motion.

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
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "linear-gradient(160deg, #f3f1fe 0%, #eef1fb 40%, #eaf4fb 100%)" }}>
      <div className="cosmos-planet" style={{ top: "6%", left: "62%", width: 380, height: 380, background: "radial-gradient(circle at 35% 30%, #d6ccff, transparent 70%)", transform: `translateY(${off * -0.05}px)` }} />
      <div className="cosmos-planet" style={{ top: "50%", left: "4%", width: 300, height: 300, background: "radial-gradient(circle at 40% 35%, #c3e9ff, transparent 72%)", transform: `translateY(${off * -0.09}px)` }} />
      <div className="cosmos-planet" style={{ top: "72%", left: "78%", width: 220, height: 220, background: "radial-gradient(circle at 40% 35%, #ffe0f0, transparent 72%)", transform: `translateY(${off * -0.07}px)` }} />
    </div>
  );
}
