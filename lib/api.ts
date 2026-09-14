"use client";

/**
 * lib/api.ts, THE integration seam for video generation (see BACKEND.md).
 *
 * With NEXT_PUBLIC_BACKEND=1 these call the Fluxion backend: submit the job to
 * the hub, poll it, and return the stored copy of the finished video. Without a
 * backend they stay mocks that replay the model's sample clip, so the demo build
 * keeps working. The signatures and return shapes are the contract the UI
 * depends on; nothing else in the app talks to a backend for generation.
 */

import { getModel } from "./models";
import { ApiError, BACKEND_ENABLED, createVideo, libraryImageLink, videoUrl, waitForVideo } from "./hub";
import { refreshBilling } from "./billing";
import { refreshGenerations } from "./generations";
import { uploadLibraryImage } from "./prefs";

export type GenerateParams = {
  slug: string; // which model to run
  prompt: string;
  aspect: string; // "16:9", "9:16", …
  resolution: string; // "720p", …
  duration: number; // seconds
  audio: boolean;
  images?: string[]; // optional image-to-video inputs
};

export type GenerateResult = {
  videoUrl: string; // playable/downloadable URL of the finished video
};

// Resolve the model's demo clip as the fake "rendered" result (demo mode).
function mockResult(slug: string): GenerateResult {
  const model = getModel(slug);
  if (!model) throw new Error(`Unknown model: ${slug}`);
  return { videoUrl: model.demoVideo };
}

function mockRun(slug: string, delay: number): Promise<GenerateResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(mockResult(slug));
      } catch (e) {
        reject(e);
      }
    }, delay);
  });
}

const LIBRARY_CONTENT = /\/media\/library\/images\/([0-9a-f]{8,})\/content/;

/**
 * A URL the video provider can fetch. Stored library images are handed over as a
 * link; a fresh data URL is stored in the library first, so the same image is
 * never uploaded twice.
 */
async function providerImageUrl(images: string[] | undefined, model: ReturnType<typeof getModel>): Promise<string | undefined> {
  const first = (images || []).find(Boolean);
  if (!first || !model?.supports.image) return undefined;
  const stored = first.match(LIBRARY_CONTENT);
  if (stored) return (await libraryImageLink(stored[1])).url;
  if (first.startsWith("data:")) {
    const blob = await (await fetch(first)).blob();
    const saved = await uploadLibraryImage(blob, { name: "reference", model: model.slug });
    return (await libraryImageLink(saved.id)).url;
  }
  if (/^https?:/i.test(first)) return first;
  return undefined; // blob: URLs live only in this browser
}

async function run(params: GenerateParams, refinements: string[] = []): Promise<GenerateResult> {
  const model = getModel(params.slug);
  if (!model) throw new ApiError(`Unknown model: ${params.slug}`, 400);
  if (model.available === false) throw new ApiError(`${model.name} has no provider available right now.`, 503);

  const prompt = [params.prompt.trim(), ...refinements.map((r) => `Refinement: ${r}`)].filter(Boolean).join("\n");
  if (!prompt) throw new ApiError("Write a prompt first.", 400);

  const created = await createVideo({
    model: model.hubModel || model.slug,
    prompt,
    seconds: params.duration,
    resolution: params.resolution,
    aspect_ratio: params.aspect,
    ...(model.supports.audio ? { audio: params.audio } : {}),
    imageUrl: await providerImageUrl(params.images, model),
  });

  const done = await waitForVideo(created.id);
  if (done.status !== "completed") throw new ApiError(done.error?.message || "Generation failed. Try again.", 502);
  const url = await videoUrl(done.id);
  void refreshGenerations().catch(() => {});
  void refreshBilling().catch(() => {});
  return { videoUrl: url };
}

/** Generate a video from a prompt. */
export function generateVideo(params: GenerateParams): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params) : mockRun(params.slug, 3500 + Math.random() * 3000);
}

/** Re-render with refinement instructions appended to the prompt. */
export function refineVideo(params: GenerateParams, refinements: string[]): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params, refinements) : mockRun(params.slug, 2000 + Math.random() * 2000);
}
