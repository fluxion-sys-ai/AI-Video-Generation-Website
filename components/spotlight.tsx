"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Site-wide soft glow that follows the cursor (off on the video-gen pages).
export function Spotlight() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;
    const move = (e: MouseEvent) => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      dot.style.opacity = "1";
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (pathname?.startsWith("/generate")) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      <div
        ref={dotRef}
        className="absolute -left-[150px] -top-[150px] h-[300px] w-[300px] rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle, rgba(255,138,30,0.15), rgba(124,189,242,0.06) 42%, transparent 68%)",
        }}
      />
    </div>
  );
}
