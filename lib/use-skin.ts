"use client";

import { useEffect, useState } from "react";
import { FORCED_SKIN, getSkin, type Skin } from "./prefs";

// Live-reactive active skin. While a skin is forced this is that skin, on the
// server and the client alike, so the static render matches. With the choice
// re-enabled it starts at "og" (the static render's look) and switches on mount.
export function useSkin(): Skin {
  const [skin, setSkin] = useState<Skin>(FORCED_SKIN ?? "og");
  useEffect(() => {
    setSkin(getSkin());
    const onChange = (e: Event) => setSkin(((e as CustomEvent).detail as Skin) ?? getSkin());
    window.addEventListener("fluxion-skin", onChange);
    return () => window.removeEventListener("fluxion-skin", onChange);
  }, []);
  return skin;
}
