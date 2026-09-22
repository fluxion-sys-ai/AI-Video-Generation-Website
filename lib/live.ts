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

/**
 * Refreshes `topic` once on mount, re-renders whenever it changes, and says
 * whether that first load has finished.
 *
 * `ready` exists because "no data yet" and "no data at all" look identical to
 * a component and mean opposite things to a person: a library still loading
 * would otherwise announce that it is empty, and invite somebody to upload
 * files they already have.
 *
 * It settles on failure too. A refresh that throws still finishes, and a page
 * that waits for success spins for ever on a network blip - the empty state is
 * wrong for a moment, a spinner that never stops is wrong permanently.
 */
export function useLiveState(
  topic: string,
  refresh?: () => Promise<unknown>,
): { version: number; ready: boolean } {
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(!refresh);
  useEffect(() => {
    let alive = true;
    const unsubscribe = subscribe(topic, () => setVersion((v) => v + 1));
    if (refresh) {
      void refresh()
        .catch(() => {})
        .finally(() => {
          if (alive) setReady(true);
        });
    }
    return () => {
      alive = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);
  return { version, ready };
}

/** Refreshes `topic` once on mount and re-renders whenever it changes. */
export function useLive(topic: string, refresh?: () => Promise<unknown>): number {
  return useLiveState(topic, refresh).version;
}
