"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { watchSystemTheme } from "@/lib/prefs";

// Site-wide soft glow that follows the cursor (off on the video-gen pages).
// This component is mounted once in the root layout, so it's also a convenient
// home for the "follow the OS theme" listener used by the `system` setting.
export function Spotlight() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);

  // Keep the effective look in sync with the OS while on the "system" setting.
  useEffect(() => watchSystemTheme(), []);

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
      {/* The gradient itself is defined via the `--spotlight` token in
          globals.css so light mode can dial it down to a softer tint. */}
      <div
        ref={dotRef}
        className="spotlight-glow absolute -left-[45px] -top-[45px] h-[90px] w-[90px] rounded-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
