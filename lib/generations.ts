"use client";

/**
 * lib/generations.ts, the user's past video generations. This is the single
 * source of truth behind both the Library "Videos" tab and the Profile "Usage
 * history" list, and it's where a finished render is recorded.
 *
 * With a backend (NEXT_PUBLIC_BACKEND=1) this reads the customer's real jobs from
 * the hub and plays the copy stored in Google Cloud Storage. Without one it stays
 * a localStorage mock. `getGenerations()` is synchronous by contract, so backend
 * mode serves a cache that `refreshGenerations()` fills; components use
 * useLive("generations", refreshGenerations) to re-render when it lands.
 */

import { getModel, getModels } from "./models";
import { BACKEND_ENABLED, listAssets, listGenerationPrompts, listGenerations, videoUrl } from "./hub";
import { notify } from "./live";

export type Generation = {
  id: string;
  slug: string; // model used
  prompt: string;
  /**
   * What was made. Every generation was a video until image models, which is
   * why this defaults rather than being required - and why the name below is
   * still `videoUrl`: it is the result, whatever kind it is, and renaming it
   * would touch every screen that shows one for no gain.
   */
  kind?: "video" | "image";
  videoUrl: string; // playable/downloadable result
  poster: string; // thumbnail
  createdAt: number; // ms timestamp
};

const KEY = "fluxion.generations";

// A little sample history so the Library/Profile aren't empty in the demo.
// Seeded once (only when the key has never been written).
function seed(): Generation[] {
  const models = getModels();
  const prompts = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
    "Timelapse of clouds over a mountain ridge",
    "Macro shot of ink blooming in clear water",
    "Drone flyover of a foggy pine forest at dawn",
    "Neon city street reflections after the rain",
    "Slow orbit around a floating crystal monolith",
    "Hand-drawn storyboard sketch coming to life",
    "Cozy cabin interior with a crackling fireplace",
    "Sweeping desert dunes under a starfield sky",
    "Underwater coral reef teeming with fish",
  ];
  // Descending ages so formatWhen() renders a natural "2h ago … 2 months ago".
  const H = 3600_000,
    D = 86_400_000;
  const ages = [2 * H, 26 * H, 3 * D, 7 * D, 8 * D, 14 * D, 15 * D, 21 * D, 30 * D, 31 * D, 32 * D, 60 * D];
  const now = Date.now();
  return prompts.map((prompt, i) => {
    const m = models[i % models.length];
    return {
      id: `seed_${i}`,
      slug: m.slug,
      prompt,
      videoUrl: m.demoVideo,
      poster: m.poster,
      createdAt: now - ages[i],
    };
  });
}

let live: Generation[] | null = null;

/** The hub's own cap on one page of its task list. */
const TASK_PAGE = 100;

/**
 * How many generations the library will load.
 *
 * There has to be a number, because every finished one costs a signed URL to
 * play, and the alternative to a number here is a page that gets slower the
 * longer somebody has been a customer. Three hundred is about a year of
 * ordinary use, and paging past it is a "load more" that can be built when
 * anybody reaches it.
 */
const LIBRARY_LIMIT = 300;

/** Resolve in bundles rather than all at once: a library of three hundred
 *  should not open with three hundred simultaneous requests. */
async function inBundles<T, R>(items: T[], size: number, work: (item: T) => Promise<R>) {
  const out: PromiseSettledResult<R>[] = [];
  for (let at = 0; at < items.length; at += size) {
    out.push(...(await Promise.allSettled(items.slice(at, at + size).map(work))));
  }
  return out;
}

/** Loads real generations (and their stored video URLs) from the backend. */
export async function refreshGenerations(limit = LIBRARY_LIMIT): Promise<void> {
  if (!BACKEND_ENABLED) return;
  // Page through it. Asking for one page was showing 24 of 104 generations and
  // calling that the library, with nothing on screen to say the rest existed.
  // The hub's shape, not this module's: same word, different type.
  const items: Awaited<ReturnType<typeof listGenerations>>["items"] = [];
  for (let page = 1; items.length < limit; page++) {
    const { items: batch, total } = await listGenerations(page, Math.min(TASK_PAGE, limit - items.length));
    items.push(...batch);
    if (!batch.length || items.length >= total) break;
  }
  const finished = items.filter((g) => g.status === "completed");
  const urls = await inBundles(finished, 16, (g) => videoUrl(g.id));
  // The hub drops a task's request when the job finishes, so the prompt comes
  // from the platform's own record of what was submitted. Without this, history
  // showed a prompt only in the browser that happened to make it - and never
  // for a generation submitted through the API.
  const recorded = new Map<string, string>();
  if (finished.some((g) => !g.prompt)) {
    // Ask for at least as many prompts as there are generations on the page, or
    // the oldest of them come back titleless.
    await listGenerationPrompts(Math.min(500, Math.max(finished.length, 100)))
      .then(({ generations }) => generations.forEach((r) => r.prompt && recorded.set(r.task_id, r.prompt)))
      .catch(() => {});
  }
  const videos: Generation[] = finished.map((g, index) => {
    const model = getModels().find((m) => (m.hubModel || m.slug) === g.model) || getModel(g.model);
    const url = urls[index];
    return {
      id: g.id,
      slug: model?.slug || g.model,
      prompt: g.prompt || recorded.get(g.id) || "(no prompt)",
      kind: "video",
      videoUrl: url.status === "fulfilled" ? url.value : "",
      poster: model?.poster || "",
      createdAt: (g.finishedAt || g.createdAt) * 1000,
    };
  });
  live = [...videos, ...(await generatedImages(Math.min(limit, 500)))].sort((a, b) => b.createdAt - a.createdAt);
  notify("generations");
}

/**
 * Generated images, which are not tasks.
 *
 * A video is a job the hub runs and remembers; an image comes back in the
 * response to the request that asked for it, so there is no task to list. What
 * there is instead is the archived copy - the backend keeps every generated
 * image in our own storage, the same as a video - so this reads the archive and
 * the platform's record of what was asked for, and joins them by id.
 *
 * Failure here is not failure of the list: an account with no image models, or
 * an older backend, simply has no images, and the videos above are unaffected.
 */
async function generatedImages(limit: number): Promise<Generation[]> {
  const listing = await listAssets({ source: "generated", kind: "image", limit }).catch(() => null);
  const rows = listing?.items ?? [];
  if (!rows.length) return [];
  const prompts = new Map<string, string>();
  await listGenerationPrompts(Math.min(500, Math.max(rows.length, 100)))
    .then(({ generations }) => generations.forEach((r) => r.prompt && prompts.set(r.task_id, r.prompt)))
    .catch(() => {});
  // The stored copy, signed. Same route as a video's: the archive does not care
  // which kind it holds.
  const urls = await inBundles(rows, 16, (row) => videoUrl(row.id));
  return rows.map((row, index) => {
    const name = row.model || "";
    const model = getModels().find((m) => (m.hubModel || m.slug) === name) || getModel(name);
    const url = urls[index];
    return {
      id: row.id,
      slug: model?.slug || name,
      prompt: prompts.get(row.id) || "(no prompt)",
      kind: "image" as const,
      videoUrl: url.status === "fulfilled" ? url.value : "",
      poster: model?.poster || "",
      createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
    };
  });
}

function save(list: Generation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota / unavailable, non-critical for the mock */
  }
}

// Newest first. Seeds sample history on first read.
export function getGenerations(): Generation[] {
  if (BACKEND_ENABLED) return live ?? [];
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    const s = seed();
    save(s);
    return s;
  }
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Generation[]) : [];
  } catch {
    return [];
  }
}

// Record a finished generation (prepended so it shows first).
export function addGeneration(g: Omit<Generation, "id" | "createdAt">): Generation {
  const rec: Generation = { ...g, id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
  if (BACKEND_ENABLED) {
    // The hub already recorded the job; just refresh so the new one appears.
    void refreshGenerations().catch(() => {});
    return rec;
  }
  save([rec, ...getGenerations()]);
  return rec;
}

// Human-friendly relative time ("2h ago", "Last week", …).
export function formatWhen(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 14) return "Last week";
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
  if (d < 60) return "Last month";
  return `${Math.floor(d / 30)} months ago`;
}
