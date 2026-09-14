"use client";

// Tiny pub/sub so the seams can keep their synchronous getters (the contract in
// BACKEND.md) while data arrives from the backend. A component calls useLive to
// kick off a refresh and re-render when the data lands.

import { useEffect, useState } from "react";

export function notify(topic: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(`fluxion-${topic}`));
}

export function subscribe(topic: string, fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(`fluxion-${topic}`, fn);
  return () => window.removeEventListener(`fluxion-${topic}`, fn);
}

/** Refreshes `topic` once on mount and re-renders whenever it changes. */
export function useLive(topic: string, refresh?: () => Promise<unknown>): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribe(topic, () => setVersion((v) => v + 1));
    if (refresh) void refresh().catch(() => {});
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);
  return version;
}
