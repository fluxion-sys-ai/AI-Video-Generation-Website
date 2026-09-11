"use client";

import { useEffect, useState } from "react";
import { getSkin, type Skin } from "./prefs";

// Live-reactive active skin. Returns "og" during SSR / before mount (so it
// matches the static render and avoids hydration mismatch), then the real saved
// skin, and updates immediately when the switcher fires the "fluxion-skin" event.
export function useSkin(): Skin {
  const [skin, setSkin] = useState<Skin>("og");
  useEffect(() => {
    setSkin(getSkin());
    const onChange = (e: Event) => setSkin(((e as CustomEvent).detail as Skin) ?? getSkin());
    window.addEventListener("fluxion-skin", onChange);
    return () => window.removeEventListener("fluxion-skin", onChange);
  }, []);
  return skin;
}
