"use client";

import { useState } from "react";

/**
 * An <img> that shows a shimmering skeleton placeholder until the image has
 * actually loaded, then fades the real image in. Purely perceptual — it never
 * delays loading, it just fills the gap while a (network-loaded) poster arrives.
 *
 * The parent must be `position: relative` (the skeleton overlays it).
 */
export function SkeletonImg({
  src,
  alt = "",
  imgClassName = "",
}: {
  src: string;
  alt?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <span aria-hidden="true" className="skeleton absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${imgClassName} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
