export type Model = {
  slug: string;
  /** Model name the hub routes; defaults to the slug. */
  hubModel?: string;
  /**
   * What it makes. "video" everywhere until image generation, which is why it
   * defaults rather than being required: a row that does not say is a video.
   *
   * The playground reads this to decide which controls exist at all - an image
   * has no duration, no sound and no separate aspect ratio - so it is the one
   * field that changes the shape of the screen rather than its contents.
   */
  modality: "video" | "image";
  /** False when no provider serves this model (backend mode). */
  available?: boolean;
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  durations: number[]; // seconds
  resolutions: string[]; // e.g. "720p"
  aspectRatios: string[]; // e.g. "16:9"
  popularResolutions: string[]; // highlighted in the dropdown
  supports: { image: boolean; audio: boolean; seed: boolean; videoReference?: boolean; audioReference?: boolean; imageReference?: boolean };
  /** What this model takes as reference material, and what each file must be.
   *  From the catalogue row in the backend, so nothing here is hardcoded. */
  reference?: ReferenceRules;
  /** Whether images may be registered with the provider as reusable characters. */
  characters?: { max_count?: number };
  /** Image models only: the pixel-count envelope the provider will render. */
  imageSize?: { min_pixels?: number; max_pixels?: number; default?: string };
  /** Image models only: USD per output image, which is the whole output price. */
  usdPerImage?: number;
  /** Cheapest price per output second, in dollars. Backend mode reads it from
   *  the hub's rate card; the demo list carries its own figures. */
  usdPerSecond: number;
  /** True for a model that is not published: it reaches this account only
   *  because someone was let in on it. The pages say so, because a customer
   *  should know when they are looking at something nobody else can see. */
  preview?: boolean;
  /** The catalogue's own order, which is an operator's decision. Used where a
   *  layout wants a stable "featured" model rather than one that changes with
   *  the current sort (see lib/model-tint.ts). */
  sortOrder?: number;
  demoVideo: string;
  poster: string;
};

// local media live in public/models/<slug>.mp4 (clip) + <slug>.jpg (poster).
// The poster is a first frame extracted from the clip (see scripts note in the
// README), self-hosted so nothing depends on external image URLs.
// Set by next.config.ts ("" unless building for GitHub Pages).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const thumb = (slug: string) => `${BASE}/models/${slug}.mp4`;
const poster = (slug: string) => `${BASE}/models/${slug}.jpg`;

export const MODELS: Model[] = [
  {
    slug: "aurora",
    name: "Aurora",
    tagline: "Cinematic text-to-video",
    description:
      "Text-to-video for cinematic shots with steady motion and coherent scenes.",
    capabilities: ["Text-to-video", "Camera control", "Sound"],
    durations: [4, 6, 8, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    popularResolutions: ["480p", "720p"],
    supports: { image: true, audio: true, seed: true },
    modality: "video",
    usdPerSecond: 0.08,
    demoVideo: thumb("aurora"),
    poster: poster("aurora"),
  },
  {
    slug: "pulse",
    name: "Pulse",
    tagline: "Fast drafts",
    description: "Fast, low-cost drafts for quick iteration on ideas.",
    capabilities: ["Text-to-video", "Fast"],
    durations: [3, 4, 6],
    resolutions: ["480p", "720p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3"],
    popularResolutions: ["480p"],
    supports: { image: false, audio: false, seed: true },
    modality: "video",
    usdPerSecond: 0.03,
    demoVideo: thumb("pulse"),
    poster: poster("pulse"),
  },
  {
    slug: "volt",
    name: "Volt",
    tagline: "Image-to-video",
    description: "Animate a still image into motion while keeping the subject.",
    capabilities: ["Image-to-video", "Motion strength"],
    durations: [4, 6, 8],
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3"],
    popularResolutions: ["720p"],
    supports: { image: true, audio: false, seed: true },
    modality: "video",
    usdPerSecond: 0.06,
    demoVideo: thumb("volt"),
    poster: poster("volt"),
  },
  {
    slug: "nova",
    name: "Nova",
    tagline: "High resolution",
    description: "Higher-resolution output for final shots up to 1080p.",
    capabilities: ["Text-to-video", "1080p", "Sound"],
    durations: [4, 6, 8, 10],
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    popularResolutions: ["720p"],
    supports: { image: true, audio: true, seed: true },
    modality: "video",
    usdPerSecond: 0.12,
    demoVideo: thumb("nova"),
    poster: poster("nova"),
  },
];

export function getModels(): Model[] {
  // With a backend the catalogue is the only source: before it arrives this is
  // empty, and callers render a loading state. Falling back to the demo list
  // here put four models that do not exist in front of customers.
  if (BACKEND_ENABLED) return live ?? [];
  return MODELS;
}

/** Models a customer can actually pick: catalogued, and served by a provider. */
export function getAvailableModels(): Model[] {
  return getModels().filter((m) => m.available !== false);
}

/**
 * The models that make one kind of thing.
 *
 * Image models are invitation-based, so for most accounts this returns nothing
 * for "image" - and the playground's Video/Image switch hides itself rather
 * than offering a tab that leads to an empty list.
 */
export function getModelsOfKind(kind: "video" | "image"): Model[] {
  return getModels().filter((m) => m.modality === kind);
}

export function getModel(slug: string): Model | undefined {
  return getModels().find((m) => m.slug === slug);
}

// ---- catalog from the backend (backend mode) --------------------------------------
// In demo mode MODELS above is the catalog. With a backend, the catalog lives in
// the database: display metadata, capabilities and prices are edited there, not here.

import { BACKEND_ENABLED, getCatalog, type ReferenceRules } from "./hub";
import { notify } from "./live";
import { parseTaskTiers, perSecondPrice } from "./pricing-expr";

let live: Model[] | null = null;

function toModel(entry: Awaited<ReturnType<typeof getCatalog>>[number]): Model {
  const tiers = entry.pricing?.billing_expr
    ? parseTaskTiers(entry.pricing.billing_expr, entry.pricing.billing_usage_schema)
    : [];
  const resolution = entry.popularResolutions[0] || entry.resolutions[0];
  const perSecond = tiers.length && resolution ? perSecondPrice(tiers, { resolution }) : null;
  return {
    slug: entry.slug,
    hubModel: entry.model,
    modality: entry.modality === "image" ? "image" : "video",
    available: entry.available,
    name: entry.name,
    tagline: entry.tagline,
    description: entry.description,
    capabilities: entry.capabilities,
    durations: entry.durations,
    resolutions: entry.resolutions,
    aspectRatios: entry.aspectRatios,
    popularResolutions: entry.popularResolutions,
    supports: {
      image: Boolean(entry.supports?.image),
      audio: Boolean(entry.supports?.audio),
      seed: Boolean(entry.supports?.seed),
      videoReference: Boolean(entry.supports?.video_reference || entry.supports?.reference?.video),
      audioReference: Boolean(entry.supports?.audio_reference || entry.supports?.reference?.audio),
      imageReference: Boolean(entry.supports?.image_reference || entry.supports?.reference?.image),
    },
    reference: entry.supports?.reference,
    // A registered image competes for the same reference-image slots, so this
    // is a cap on how many may be named at once rather than a separate budget.
    characters: entry.supports?.portrait,
    imageSize: entry.supports?.image_size,
    // Per image rather than per second, and read straight off the hub's rate
    // card: an image is one price per call, so there is no expression to parse
    // and `usdPerSecond` means nothing for it.
    usdPerImage: entry.pricing?.model_price ?? undefined,
    preview: entry.preview,
    usdPerSecond: perSecond ?? 0,
    sortOrder: entry.sortOrder,
    demoVideo: entry.demoVideo || `${BASE}/models/${entry.slug}.mp4`,
    poster: entry.poster || `${BASE}/models/${entry.slug}.jpg`,
  };
}

/** Loads the catalog from the backend. Safe to call repeatedly. */
export async function refreshCatalog(): Promise<void> {
  if (!BACKEND_ENABLED) return;
  const entries = await getCatalog();
  live = entries.map(toModel);
  notify("models");
}
