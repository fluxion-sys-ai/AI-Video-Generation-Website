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
import { ApiError, BACKEND_ENABLED, checkReferences, createImage, createVideo, libraryImageLink, videoUrl, waitForVideo } from "./hub";
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
  /** Library media to use as reference material, by id (see lib/hub.checkReferences). */
  referenceVideoIds?: string[];
  referenceAudioIds?: string[];
  /** Stills the model follows throughout, which is not the same as a first frame. */
  referenceImageIds?: string[];
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

const LIBRARY_CONTENT = /\/media\/library\/(?:media|images)\/([0-9a-f]{8,})\/content/;

/**
 * Reference material, checked and turned into URLs the provider will fetch.
 *
 * The check is the backend's, not the browser's: it decides whether these files
 * may be used for this model, and a refusal surfaces as the message a customer
 * needs to fix it. Nothing is minted until it passes.
 */
async function referenceMetadata(params: GenerateParams, model: ReturnType<typeof getModel>): Promise<Record<string, unknown>> {
  const videos = params.referenceVideoIds || [];
  const audios = params.referenceAudioIds || [];
  const stills = params.referenceImageIds || [];
  if (!model || (!videos.length && !audios.length && !stills.length)) return {};
  const checked = await checkReferences({
    model: model.slug,
    ...(videos.length ? { reference_video: videos } : {}),
    ...(audios.length ? { reference_audio: audios } : {}),
    // A picked image that has been registered with the provider comes back as
    // an asset reference instead of a link; the backend makes that swap per
    // file, so nothing here has to know which is which.
    ...(stills.length ? { reference_image: stills } : {}),
  });
  const metadata: Record<string, unknown> = {};
  if (checked.urls.reference_video) metadata.reference_video = checked.urls.reference_video;
  if (checked.urls.reference_audio) metadata.reference_audio = checked.urls.reference_audio;
  if (checked.urls.reference_image) metadata.reference_image = checked.urls.reference_image;
  return metadata;
}

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

  const metadata = await referenceMetadata(params, model);
  const created = await createVideo({
    model: model.hubModel || model.slug,
    prompt,
    seconds: params.duration,
    resolution: params.resolution,
    aspect_ratio: params.aspect,
    ...(model.supports.audio ? { audio: params.audio } : {}),
    // For some models reference material and a first frame are different modes
    // upstream, and a request that mixes them is refused - so for those, a
    // selection carrying reference media never also sends an image. Models that
    // take both (Seedance) say so in their catalogue row, and keep the image.
    imageUrl:
      Object.keys(metadata).length && model.reference?.mutually_exclusive_with_frames
        ? undefined
        : await providerImageUrl(params.images, model),
    metadata,
  });

  const done = await waitForVideo(created.id);
  if (done.status !== "completed") throw new ApiError(done.error?.message || "Generation failed. Try again.", 502);
  const url = await videoUrl(done.id);
  void refreshGenerations().catch(() => {});
  void refreshBilling().catch(() => {});
  return { videoUrl: url };
}

// ---- images ----------------------------------------------------------------------

export type ImageParams = {
  slug: string;
  prompt: string;
  /** "2048x1152": an image's size is one control, not a resolution and a ratio. */
  size: string;
  /** Library stills to work from, by id. Image-to-image. */
  referenceImageIds?: string[];
};

export type ImageResult = {
  /** Somewhere the browser can show it. The provider's own URL, which expires. */
  imageUrl: string;
};

async function runImage(params: ImageParams, refinements: string[] = []): Promise<ImageResult> {
  const model = getModel(params.slug);
  if (!model) throw new ApiError(`Unknown model: ${params.slug}`, 400);
  if (model.available === false) throw new ApiError(`${model.name} has no provider available right now.`, 503);

  const prompt = [params.prompt.trim(), ...refinements.map((r) => `Refinement: ${r}`)].filter(Boolean).join("\n");
  if (!prompt) throw new ApiError("Write a prompt first.", 400);

  // The same check the backend runs on submit, for the same reason: it decides
  // whether these files may be used here, and its refusal is the message that
  // tells a customer how to fix the selection.
  const stills = params.referenceImageIds || [];
  let inputs: string[] = [];
  if (stills.length) {
    const checked = await checkReferences({ model: model.slug, reference_image: stills });
    // One picked file comes back as one URL rather than a list of one.
    const got = checked.urls.reference_image;
    inputs = got === undefined ? [] : Array.isArray(got) ? got : [got];
  }

  const images = await createImage({
    model: model.hubModel || model.slug,
    prompt,
    size: params.size,
    ...(inputs.length ? { image: inputs } : {}),
  });
  const first = images.find((i) => i.url || i.b64_json);
  if (!first) throw new ApiError("The provider returned no image.", 502);
  // The archived copy is in the library either way; this is only what to show
  // on screen now.
  const url = first.url || `data:image/png;base64,${first.b64_json}`;
  void refreshGenerations().catch(() => {});
  void refreshBilling().catch(() => {});
  return { imageUrl: url };
}

/** Generate one image from a prompt, and optionally from images. */
export function generateImage(params: ImageParams): Promise<ImageResult> {
  if (BACKEND_ENABLED) return runImage(params);
  const model = getModel(params.slug);
  if (!model) return Promise.reject(new Error(`Unknown model: ${params.slug}`));
  return new Promise((resolve) => setTimeout(() => resolve({ imageUrl: model.poster }), 2500));
}

/** Re-render an image with refinement instructions appended to the prompt. */
export function refineImage(params: ImageParams, refinements: string[]): Promise<ImageResult> {
  if (BACKEND_ENABLED) return runImage(params, refinements);
  return generateImage(params);
}

/** Generate a video from a prompt. */
export function generateVideo(params: GenerateParams): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params) : mockRun(params.slug, 3500 + Math.random() * 3000);
}

/** Re-render with refinement instructions appended to the prompt. */
export function refineVideo(params: GenerateParams, refinements: string[]): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params, refinements) : mockRun(params.slug, 2000 + Math.random() * 2000);
}
