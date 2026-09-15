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

import { getModel, getModels } from "./models";
import { ApiError, BACKEND_ENABLED, checkReferences, createVideo, getGeneration, libraryImageLink, videoUrl, waitForVideo } from "./hub";
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
  if (!model || (!videos.length && !audios.length)) return {};
  const checked = await checkReferences({
    model: model.slug,
    ...(videos.length ? { reference_video: videos } : {}),
    ...(audios.length ? { reference_audio: audios } : {}),
  });
  const metadata: Record<string, unknown> = {};
  if (checked.urls.reference_video) metadata.reference_video = checked.urls.reference_video;
  if (checked.urls.reference_audio) metadata.reference_audio = checked.urls.reference_audio;
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
    // Reference material and a first frame are different modes upstream, so a
    // selection that carries reference media never also sends an image.
    imageUrl: Object.keys(metadata).length ? undefined : await providerImageUrl(params.images, model),
    metadata,
  });

  const done = await waitForVideo(created.id);
  if (done.status !== "completed") throw new ApiError(done.error?.message || "Generation failed. Try again.", 502);
  const url = await videoUrl(done.id);
  void refreshGenerations().catch(() => {});
  void refreshBilling().catch(() => {});
  return { videoUrl: url };
}

/**
 * Run a past generation again, exactly as it was asked for.
 *
 * The recorded request carries links that have since expired, so the files it
 * used are minted afresh from the library by id. A file that has been deleted
 * cannot be minted, and that is an error rather than a quiet substitution: the
 * customer asked for *this* generation again, not a different one.
 */
export async function regenerateFrom(taskId: string): Promise<GenerateResult> {
  if (!BACKEND_ENABLED) throw new ApiError("Repeating a generation needs the backend.", 400);
  const record = await getGeneration(taskId);
  const request = { ...record.request } as Record<string, unknown>;

  const missing = record.inputs.filter((i) => !i.available);
  if (missing.length) {
    const names = missing.map((i) => i.name || i.role).join(", ");
    throw new ApiError(
      `This used ${missing.length} file that is no longer in your library (${names}). Upload it again, or start from the prompt.`,
      409,
    );
  }

  // Fresh links for whatever it used, judged against the model's rules again.
  const byRole: Record<string, string[]> = {};
  for (const input of record.inputs) {
    if (!input.item_id) continue;
    const field =
      input.role === "reference video" ? "reference_video"
      : input.role === "reference audio" ? "reference_audio"
      : input.role === "reference image" ? "reference_image"
      : input.role === "last frame" ? "last_frame"
      : "first_frame";
    (byRole[field] ||= []).push(input.item_id);
  }
  const model = String(request.model || "");
  if (Object.keys(byRole).length) {
    const checked = await checkReferences({ model: modelSlugFor(model), ...byRole });
    const metadata = { ...((request.metadata as Record<string, unknown>) || {}) };
    for (const [field, urls] of Object.entries(checked.urls)) {
      if (field === "first_frame" || field === "last_frame") {
        if (field === "first_frame") request.image = urls as string;
        else metadata.last_frame_image = urls as string;
      } else {
        metadata[field] = urls;
      }
    }
    request.metadata = metadata;
  }

  const created = await createVideo(request as unknown as Parameters<typeof createVideo>[0]);
  const done = await waitForVideo(created.id);
  if (done.status !== "completed") throw new ApiError(done.error?.message || "Generation failed. Try again.", 502);
  const url = await videoUrl(done.id);
  void refreshGenerations().catch(() => {});
  void refreshBilling().catch(() => {});
  return { videoUrl: url };
}

/** The catalogue slug for a hub model name, which the references call wants. */
function modelSlugFor(hubModel: string): string {
  return getModels().find((m) => (m.hubModel || m.slug) === hubModel)?.slug || hubModel;
}

/** Generate a video from a prompt. */
export function generateVideo(params: GenerateParams): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params) : mockRun(params.slug, 3500 + Math.random() * 3000);
}

/** Re-render with refinement instructions appended to the prompt. */
export function refineVideo(params: GenerateParams, refinements: string[]): Promise<GenerateResult> {
  return BACKEND_ENABLED ? run(params, refinements) : mockRun(params.slug, 2000 + Math.random() * 2000);
}
