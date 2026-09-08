export type Model = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  durations: number[]; // seconds
  resolutions: string[]; // e.g. "720p"
  aspectRatios: string[]; // e.g. "16:9"
  popularResolutions: string[]; // highlighted in the dropdown
  supports: { image: boolean; audio: boolean; seed: boolean };
  creditsPerSecond: number;
  demoVideo: string;
  poster: string;
};

const V = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";
// local thumbnail videos live in public/models/<slug>.mp4 (drop your clips there)
const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";
const thumb = (slug: string) => `${BASE}/models/${slug}.mp4`;

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
    creditsPerSecond: 8,
    demoVideo: thumb("aurora"),
    poster: `${V}/images/BigBuckBunny.jpg`,
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
    creditsPerSecond: 3,
    demoVideo: thumb("pulse"),
    poster: `${V}/images/ForBiggerBlazes.jpg`,
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
    creditsPerSecond: 6,
    demoVideo: thumb("volt"),
    poster: `${V}/images/ForBiggerJoyrides.jpg`,
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
    creditsPerSecond: 12,
    demoVideo: thumb("nova"),
    poster: `${V}/images/Sintel.jpg`,
  },
];

export function getModels(): Model[] {
  return MODELS;
}

export function getModel(slug: string): Model | undefined {
  return MODELS.find((m) => m.slug === slug);
}
