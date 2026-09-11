"use client";

/**
 * lib/generations.ts, the user's past video generations. This is the single
 * source of truth behind both the Library "Videos" tab and the Profile "Usage
 * history" list, and it's where a finished render is recorded.
 *
 * BACKEND DEVS: mock backed by localStorage. Replace the bodies with real calls
 * (see BACKEND.md):
 *   - getGenerations()  → GET  /api/generations
 *   - addGeneration(g)  → happens server-side when a render completes; the
 *                         generate page calls this after api.generateVideo()
 * Keep the return shape (`Generation`), the UI depends on it.
 */

import { getModels } from "./models";

export type Generation = {
  id: string;
  slug: string; // model used
  prompt: string;
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
