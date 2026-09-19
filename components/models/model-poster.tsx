"use client";

// A model's picture, and what to show when it has none.
//
// Every card on the site assumed the poster loads: `<img src={m.poster}>` over
// a black box, with the file named after the slug. A model we have not yet
// generated a sample for - an unreleased one, most obviously - has no such
// file, so the card drew a black rectangle with a broken image in it, which
// reads as something failing rather than as art we have not made yet.
//
// So the fallback is the model's own colour (lib/model-tint.ts) with its
// initial, and the image is layered on top only once it has actually loaded.
// Nothing flickers: the tint is what is behind the picture anyway.

import { useState } from "react";
import { modelTint } from "@/lib/model-tint";

export function ModelPoster({
  slug,
  name,
  src,
  className = "",
  imageClassName = "h-full w-full object-cover",
  children,
}: {
  slug: string;
  name: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  /** Overlays (chips, hearts) that belong inside the frame. */
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    // Positioning belongs to the caller, and is not defaulted here: a card that
    // needs `absolute inset-0` would otherwise get both classes, and Tailwind
    // resolves that by stylesheet order rather than by the order they are
    // written - which put the frame in the flow, inset by the card's padding,
    // and pushed the model's name off the tile.
    //
    // containerType so the initial can size itself to the frame it is in: the
    // same component draws a 28 px thumbnail and a half-screen tile.
    <div className={`overflow-hidden ${className}`} style={{ background: modelTint(slug), containerType: "inline-size" }}>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-[clamp(28px,12cqw,72px)] font-extrabold"
        style={{ color: "rgba(26,20,64,0.22)" }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      {show && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src ?? ""} alt="" onError={() => setFailed(true)} className={`relative ${imageClassName}`} />
      )}
      {children}
    </div>
  );
}
