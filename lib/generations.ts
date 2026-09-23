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

/**
 * A page of history, and the most the library keeps in memory.
 *
 * Both numbers exist for the same reason: what this screen costs should not
 * grow with how long somebody has been a customer. One page is what loads
 * before anything is on screen; the cap is where older pages start being
 * forgotten as newer ones arrive, so paging for a long time cannot turn into a
 * tab holding a thousand rows and a thousand media elements.
 */
const PAGE = 24;
// The most rows this screen will hold. Not an eviction point: dropping rows out
// of the middle of a grid somebody is reading moves everything under their
// cursor, which is worse than the memory it saves - a row is a couple of
// hundred bytes, while the expensive parts (the signed URL and the media
// element) are already released when a card scrolls away. This is where "Load
// more" stops offering, and says so.
const KEEP = 300;
// Generated images, fetched once. Paging these too would need an offset on the
// assets listing; nobody has enough of them for that to be the next problem.
const IMAGE_LIMIT = 96;

let loadedPage = 0;
let reportedTotal = 0;

/** What is on screen, what exists, and whether there is more to ask for. */
export function generationsLoaded(): { shown: number; total: number; more: boolean; capped: boolean } {
  const videos = (live ?? []).filter((g) => g.kind !== "image").length;
  const shown = live?.length ?? 0;
  return {
    shown,
    total: Math.max(reportedTotal, videos),
    more: videos < reportedTotal && videos < KEEP,
    capped: videos >= KEEP,
  };
}

/**
 * How many videos and images this account has generated, in total.
 *
 * Counted by the backend over everything, because the number beside a tab
 * should answer "how many do I have" and not "how many are currently loaded" -
 * the second changes while you scroll and is never what the question meant.
 */
let totalsByKind: { video: number; image: number } = { video: 0, image: 0 };

export function generationTotals(): { video: number; image: number } {
  return totalsByKind;
}

/**
 * The playable URL for one result, resolved when something actually wants it.
 *
 * Signing is a round trip per file, so the library used to open with one for
 * every row it had loaded. Cards ask for their own as they come into view
 * instead, and this holds the last few so scrolling back is free without
 * holding them all: past the cap the oldest is dropped, and signed again if it
 * is ever wanted, which costs one request rather than a tab full of them.
 */
const URLS = new Map<string, string>();
const URLS_KEEP = 64;

export async function resultUrl(id: string): Promise<string> {
  const held = URLS.get(id);
  if (held) {
    URLS.delete(id);
    URLS.set(id, held); // touch: most recently wanted is last to go
    return held;
  }
  const url = await videoUrl(id);
  URLS.set(id, url);
  while (URLS.size > URLS_KEEP) {
    const oldest = URLS.keys().next().value;
    if (oldest === undefined) break;
    URLS.delete(oldest);
  }
  return url;
}

/** The first page, from scratch. */
export async function refreshGenerations(): Promise<void> {
  if (!BACKEND_ENABLED) return;
  loadedPage = 0;
  live = null;
  await loadMoreGenerations();
}

/**
 * The next page, appended - and the far end dropped if we hold too many.
 *
 * Asking for one page and calling it the library is what this replaces: an
 * account with 104 generations saw 24 of them, with nothing on screen to say
 * the rest were there.
 */
export async function loadMoreGenerations(): Promise<void> {
  if (!BACKEND_ENABLED) return;
  const wanted = loadedPage + 1;
  const { items, total } = await listGenerations(wanted, PAGE);
  loadedPage = wanted;
  reportedTotal = total;
  const finished = items.filter((g) => g.status === "completed");
  // The hub drops a task's request when the job finishes, so the prompt comes
  // from the platform's own record of what was submitted. Without this, history
  // showed a prompt only in the browser that happened to make it - and never
  // for a generation submitted through the API.
  const recorded = new Map<string, string>();
  if (finished.some((g) => !g.prompt)) {
    await listGenerationPrompts(Math.min(500, Math.max((live?.length ?? 0) + finished.length, 100)))
      .then(({ generations }) => generations.forEach((r) => r.prompt && recorded.set(r.task_id, r.prompt)))
      .catch(() => {});
  }
  const videos: Generation[] = finished.map((g) => {
    const model = getModels().find((m) => (m.hubModel || m.slug) === g.model) || getModel(g.model);
    return {
      id: g.id,
      slug: model?.slug || g.model,
      prompt: g.prompt || recorded.get(g.id) || "(no prompt)",
      kind: "video",
      // Left empty on purpose: whoever shows it resolves it through resultUrl.
      videoUrl: "",
      poster: model?.poster || "",
      createdAt: (g.finishedAt || g.createdAt) * 1000,
    };
  });
  // Images come with the first page only. They are not tasks - there is no
  // page of them to ask the hub for - and there are far fewer, so they are
  // fetched once and kept whole.
  const images = wanted === 1 ? await generatedImages(IMAGE_LIMIT) : [];
  const known = new Set((live ?? []).map((g) => g.id));
  const all = [...(live ?? []), ...[...videos, ...images].filter((g) => !known.has(g.id))];
  // The cap applies to the videos, which is what grows page by page. Trimming
  // the merged list would have thrown the images away instead: they are the
  // oldest rows in it, so the second "Load more" would have emptied the image
  // tab.
  const keptVideos = all.filter((g) => g.kind !== "image").sort((a, b) => b.createdAt - a.createdAt).slice(0, KEEP);
  // Past the cap there is nothing more to offer, whatever the hub says it has.
  const keptImages = all.filter((g) => g.kind === "image");
  live = [...keptVideos, ...keptImages].sort((a, b) => b.createdAt - a.createdAt);
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
  if (listing?.kinds?.generated) {
    totalsByKind = {
      video: listing.kinds.generated.video ?? 0,
      image: listing.kinds.generated.image ?? 0,
    };
  }
  const rows = listing?.items ?? [];
  if (!rows.length) return [];
  const prompts = new Map<string, string>();
  await listGenerationPrompts(Math.min(500, Math.max(rows.length, 100)))
    .then(({ generations }) => generations.forEach((r) => r.prompt && prompts.set(r.task_id, r.prompt)))
    .catch(() => {});
  // The stored copy, signed. Same route as a video's: the archive does not care
  // which kind it holds.
  return rows.map((row) => {
    const name = row.model || "";
    const model = getModels().find((m) => (m.hubModel || m.slug) === name) || getModel(name);
    return {
      id: row.id,
      slug: model?.slug || name,
      prompt: prompts.get(row.id) || "(no prompt)",
      kind: "image" as const,
      videoUrl: "",
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
