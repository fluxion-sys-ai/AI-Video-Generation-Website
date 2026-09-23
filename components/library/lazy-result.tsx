"use client";

import { useEffect, useRef, useState } from "react";
import { resultUrl } from "@/lib/generations";

/**
 * A result's own frame, fetched when it comes near the screen and let go when
 * it leaves.
 *
 * A grid of clips is the expensive kind of list: every card that has a `src`
 * costs a signed URL to get it and a media element to hold it, and a browser
 * given thirty of those at once spends its first seconds fetching metadata for
 * videos nobody has looked at yet. So a card starts as a poster, asks for its
 * URL when it is within a screen's reach, and drops the URL again once it is
 * two screens away - which releases the element's buffers and leaves the page
 * costing about what is visible rather than about how much history there is.
 *
 * `rootMargin` is generous on purpose: loading starts before the card is in
 * view, so scrolling at a normal speed still finds frames already painted.
 */
export function LazyResult({
  id,
  kind,
  poster,
  alt,
  className = "",
  playerRef,
}: {
  id: string;
  kind?: "video" | "image";
  poster?: string;
  alt: string;
  className?: string;
  playerRef?: (element: HTMLVideoElement | null) => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    let alive = true;
    let wanted = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const near = entries.some((entry) => entry.isIntersecting);
        if (near && !wanted) {
          wanted = true;
          resultUrl(id)
            .then((found) => {
              if (alive) setUrl(found);
            })
            .catch(() => {});
        } else if (!near && wanted) {
          // Far away now: give the bytes back. The URL is cached for a while by
          // resultUrl, so coming back is usually free and never more than one
          // request.
          wanted = false;
          if (alive) setUrl("");
        }
      },
      { rootMargin: "300px 0px", threshold: 0 },
    );
    observer.observe(element);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [id]);

  return (
    <div ref={box} className="h-full w-full">
      {url && kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={className || "h-full w-full object-contain"} />
      ) : url ? (
        <video
          ref={playerRef}
          src={url}
          muted
          loop
          playsInline
          preload="metadata"
          className={className || "h-full w-full object-cover"}
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className={className || "h-full w-full object-cover"} />
      ) : (
        <div className="h-full w-full bg-black" />
      )}
    </div>
  );
}
