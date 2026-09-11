"use client";

import { useSkin } from "@/lib/use-skin";
import { LandingOG, LandingEditorial, LandingLuxury, LandingPlayful } from "@/components/landings";

// The landing page has a genuinely different layout per skin (not just a
// recolor). useSkin() is live-reactive, so flipping the switcher swaps the whole
// layout in place. Defaults to OG during SSR / first paint.
export default function Home() {
  const skin = useSkin();
  if (skin === "editorial") return <LandingEditorial />;
  if (skin === "luxury") return <LandingLuxury />;
  if (skin === "playful") return <LandingPlayful />;
  return <LandingOG />;
}
