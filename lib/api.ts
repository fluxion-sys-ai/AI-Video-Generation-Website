"use client";

/**
 * lib/api.ts, THE integration seam between this frontend demo and a real
 * backend. Every function here is a MOCK that resolves canned data after a
 * short delay (to imitate a render job). To go live, replace each function
 * body with a real `fetch()` to your API; keep the signatures + return shapes
 * exactly, because that is the contract the UI depends on. See BACKEND.md.
 *
 * Nothing else in the app calls setTimeout to fake a network request, it all
 * funnels through here, so this file is the whole "swap the mock for real"
 * surface for video generation.
 */

import { getModel } from "./models";

export type GenerateParams = {
  slug: string; // which model to run
  prompt: string;
  aspect: string; // "16:9", "9:16", …
  resolution: string; // "720p", …
  duration: number; // seconds
  audio: boolean;
  images?: string[]; // optional image-to-video inputs (data URLs in the demo)
};

export type GenerateResult = {
  videoUrl: string; // playable/downloadable URL of the finished video
};

// Resolve the model's demo clip as the fake "rendered" result.
function mockResult(slug: string): GenerateResult {
  const model = getModel(slug);
  if (!model) throw new Error(`Unknown model: ${slug}`);
  return { videoUrl: model.demoVideo };
}

/**
 * MOCK: generate a video from a prompt.
 * Real impl: POST /api/generate → poll the job → return the finished video URL.
 */
export function generateVideo(params: GenerateParams): Promise<GenerateResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(mockResult(params.slug));
      } catch (e) {
        reject(e);
      }
    }, 3500 + Math.random() * 3000);
  });
}

/**
 * MOCK: re-render with refinement instructions applied on top of the last run.
 * Real impl: POST /api/refine with the prior job id + the new instructions.
 */
export function refineVideo(params: GenerateParams, _refinements: string[]): Promise<GenerateResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(mockResult(params.slug));
      } catch (e) {
        reject(e);
      }
    }, 2000 + Math.random() * 2000);
  });
}
