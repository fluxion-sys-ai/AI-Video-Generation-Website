"use client";

import {
  BACKEND_ENABLED,
  createLibraryFolder,
  deleteLibraryFolder,
  deleteLibraryImage,
  libraryImageLink,
  listLibrary,
  renameLibraryFolder,
  setLibraryOrder,
  updateLibraryImage,
  uploadLibraryImage as hubUploadLibraryImage,
  registerCharacter,
  unregisterCharacter,
  uploadLibraryMedia as hubUploadLibraryMedia,
  type LibraryFolder,
  type CharacterState,
  type LibraryItem,
  type LibraryLimits,
} from "./hub";
import { notify } from "./live";

// Frontend-only favorites + recently-used model tracking (localStorage).
const FAV_KEY = "fluxion.favorites";
const REC_KEY = "fluxion.recents";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function getFavorites(): string[] {
  return read(FAV_KEY);
}

export function isFavorite(slug: string): boolean {
  return read(FAV_KEY).includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const favs = read(FAV_KEY);
  const next = favs.includes(slug) ? favs.filter((s) => s !== slug) : [...favs, slug];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next.includes(slug);
}

export function getRecents(): string[] {
  return read(REC_KEY);
}

export function addRecent(slug: string) {
  if (typeof window === "undefined") return;
  const next = [slug, ...read(REC_KEY).filter((s) => s !== slug)].slice(0, 8);
  localStorage.setItem(REC_KEY, JSON.stringify(next));
}

// Persisted library images. In backend mode these live in the backend's bucket
// (see the server-backed section at the end of this file) so they follow the
// customer across devices; the getters below then serve that cache.
// Seeded with samples by the library on first load,
// then appended to whenever the user uploads, including uploads made inside a
// model's playground (those carry `model`). Stored as data URLs so they survive
// navigation/reload (frontend-only mock).
export type LibImage = {
  id: string;
  src: string;
  name: string;
  model?: string;
  size?: number; // bytes (uploads only)
  uses?: number; // times sent to a model's playground
  addedAt?: number; // upload timestamp (ms)
  fav?: boolean; // hearted in the library
};
const LIB_IMAGES_KEY = "fluxion.libraryImages";

export function getLibraryImages(): LibImage[] {
  if (BACKEND_ENABLED) return liveImages ?? [];
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(LIB_IMAGES_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function saveLibraryImages(list: LibImage[]) {
  if (BACKEND_ENABLED || typeof window === "undefined") return;
  try {
    localStorage.setItem(LIB_IMAGES_KEY, JSON.stringify(list));
  } catch {
    /* quota / unavailable, non-critical for the mock */
  }
}
// Prepend new uploads so the newest show first.
export function addLibraryImages(items: LibImage[]) {
  if (BACKEND_ENABLED) return; // backend mode stores uploads through uploadLibraryImage()
  saveLibraryImages([...items, ...getLibraryImages()]);
}

// Hand-off of library images to a model's playground. The library writes the
// selected images here, then routes to /generate?model=…; the playground reads
// and clears them on load (see app/generate/page.tsx).
const PENDING_IMAGES_KEY = "fluxion.pendingImages";
/** An image handed to the playground from the library. The id is what lets the
 *  playground select it as reference material; the url alone can only be shown. */
export type PendingImage = { id?: string; url: string; name: string };

export function setPendingImages(list: PendingImage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_IMAGES_KEY, JSON.stringify(list));
}

// A whole past generation, handed to the playground to be edited and run again.
// One-shot, like the images above: the playground takes it on arrival, so a
// later reload is an empty form rather than a surprise.
const PENDING_REQUEST_KEY = "fluxion.pendingRequest";

export type PendingRequest = {
  /** The request as the backend recorded it. */
  request: Record<string, unknown>;
  /** Library ids by role, so the playground can re-select the real files. */
  inputs: { role: string; item_id: string | null; name: string | null; available: boolean }[];
  /** Which generation it came from, for anything that wants to say so. */
  taskId: string;
};

export function setPendingRequest(pending: PendingRequest) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(pending));
}

export function takePendingRequest(): PendingRequest | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PENDING_REQUEST_KEY);
  if (!raw) return null;
  localStorage.removeItem(PENDING_REQUEST_KEY);
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? (value as PendingRequest) : null;
  } catch {
    return null;
  }
}

// Read the queued images and remove them (one-shot).
export function takePendingImages(): PendingImage[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PENDING_IMAGES_KEY);
  if (!raw) return [];
  localStorage.removeItem(PENDING_IMAGES_KEY);
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// User settings (Profile → Settings). Persisted and actually applied:
//   - autoplay:          hover-play video thumbnails (library + catalog)
//   - defaultModel:      preselected model when opening /generate with no ?model
//   - defaultResolution: initial resolution in the playground (when supported)
//   - emailUpdates:      notification preference (mock; stored only)
export type Settings = {
  autoplay: boolean;
  defaultModel: string;
  defaultResolution: string;
  emailUpdates: boolean;
};
const SETTINGS_KEY = "fluxion.settings";
const SETTINGS_DEFAULTS: Settings = { autoplay: true, defaultModel: "", defaultResolution: "", emailUpdates: false };

export function getSettings(): Settings {
  if (typeof window === "undefined") return SETTINGS_DEFAULTS;
  try {
    return { ...SETTINGS_DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return SETTINGS_DEFAULTS;
  }
}
export function saveSettings(patch: Partial<Settings>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...patch }));
}
// Convenience: hover-autoplay on by default.
export function isAutoplay(): boolean {
  return getSettings().autoplay;
}

// Theme setting.
//   - "dark"   → always the dark (default brand) look.
//   - "light"  → always the light look (matches the Fluxion marketing site).
//   - "system" → follow the OS `prefers-color-scheme`, and live-update when it
//                changes (see `watchSystemTheme`).
// The stored value is one of these three; the *effective* look ("dark"/"light")
// is derived by `resolveTheme`. Nothing stored ⇒ "dark" (brand default).
const THEME_KEY = "fluxion.theme";
export type Theme = "dark" | "light" | "system";
export type EffectiveTheme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "system" ? v : "dark";
}

// Does the OS currently ask for a light color scheme?
function systemPrefersLight(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

// Collapse a setting into the actual look to render.
export function resolveTheme(t: Theme): EffectiveTheme {
  if (t === "system") return systemPrefersLight() ? "light" : "dark";
  return t;
}

// Persist the setting and reflect it on <html> immediately (toggling `.light`,
// which every design token keys off of, see app/globals.css).
export function applyTheme(t: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", resolveTheme(t) === "light");
}

// Brand "skin", an independent axis from dark/light. Overrides the whole token
// palette + fonts + radii site-wide via a class on <html> (see app/globals.css):
//   - "og"        → the original Fluxion look (dark/light theme still applies)
//   - "editorial" → warm frosted-glass, chunky black headlines (its own palette)
//   - "luxury"    → navy + gold, serif headlines, wave dividers (its own palette)
//   - "playful"   → white + blocky pastels, rounded friendly type, yellow pills
//   - "cosmos"    → deep-space neon, horizontal slideshow, starfield backdrop
// This is a preview mechanism so all skins can be compared across the real site.
const SKIN_KEY = "fluxion.skin";
export type Skin = "og" | "editorial" | "luxury" | "playful" | "cosmos";

// The look the product ships with. The other skins stay in the code and in
// globals.css; set this to null to let people choose again, which re-enables
// the switcher in app/layout.tsx and the boot script's saved-skin branch.
export const FORCED_SKIN: Skin | null = "playful";

export function getSkin(): Skin {
  if (FORCED_SKIN) return FORCED_SKIN;
  if (typeof window === "undefined") return "og";
  const v = localStorage.getItem(SKIN_KEY);
  return v === "editorial" || v === "luxury" || v === "playful" || v === "cosmos" ? v : "og";
}

// Persist the skin and reflect it on <html> immediately (toggling the skin class
// that every alternate-theme token keys off of).
export function applySkin(skin: Skin) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SKIN_KEY, skin);
  const el = document.documentElement;
  el.classList.remove("skin-editorial", "skin-luxury", "skin-playful", "skin-cosmos");
  if (skin !== "og") el.classList.add(`skin-${skin}`);
  // Notify React components (useSkin) so layouts, not just CSS, re-render live.
  window.dispatchEvent(new CustomEvent("fluxion-skin", { detail: skin }));
}

// Re-apply the effective look whenever the OS scheme flips, but only while the
// user is on "system". Returns an unsubscribe fn. Mounted once site-wide in
// components/spotlight.tsx.
export function watchSystemTheme(): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = () => {
    if (getTheme() === "system") {
      document.documentElement.classList.toggle("light", mq.matches);
    }
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// ---- library images and folders on the server (backend mode) ---------------------
// getLibraryImages() is synchronous by contract, so it serves this cache;
// components call useLive("library", refreshLibrary) to fill and follow it.

let liveImages: LibImage[] | null = null;
let liveMedia: LibraryItem[] = [];
let liveFolders: LibraryFolder[] = [];
let folderOfImage: Record<string, string | null> = {};
let liveLimits: LibraryLimits | null = null;

export async function refreshLibrary(): Promise<void> {
  if (!BACKEND_ENABLED) return;
  const { items, folders, limits } = await listLibrary();
  liveFolders = folders;
  liveLimits = limits;
  liveMedia = items;
  folderOfImage = Object.fromEntries(items.map((i) => [i.id, i.folder_id]));
  // The image grid is for images; video and audio are reference material and
  // are listed as themselves (getLibraryMedia).
  liveImages = items
    .filter((i) => i.kind === "image")
    .map((i) => ({
      id: i.id,
      src: i.url,
      name: i.name,
      model: i.model || undefined,
      size: i.bytes,
      uses: i.uses,
      addedAt: Date.parse(i.created_at),
      fav: i.favourite,
    }));
  notify("library");
}

/** Stored video or audio, as the backend describes it (duration, codec, size). */
export function getLibraryMedia(kind?: "video" | "audio" | "image"): LibraryItem[] {
  return kind ? liveMedia.filter((i) => i.kind === kind) : liveMedia;
}

// ---- uploads: one shape for everything the customer put here ---------------------
// The library shows two things: what the platform generated (videos, from
// lib/generations) and what the customer uploaded (images, video and audio).
// This is the second of those, in one shape regardless of where it is stored -
// the backend's bucket, or this browser in demo mode, which only ever holds
// images.

export type Upload = {
  id: string;
  kind: "image" | "video" | "audio";
  name: string;
  /** Short-lived URL for display and playback. */
  url: string;
  model?: string;
  size?: number;
  uses?: number;
  addedAt?: number;
  fav?: boolean;
  folderId?: string | null;
  /** What the backend measured, where it could. Null means unknown. */
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  container?: string;
  codec?: string;
  /**
   * Set when this image is registered with the video provider as a portrait.
   * Only images can be, and only from the library - the playground selects one
   * but never makes one, because registering costs a slot of a purchased
   * allowance and is not a decision to walk into while assembling one clip.
   */
  character?: CharacterState | null;
};

export function getUploads(kind?: Upload["kind"]): Upload[] {
  const all: Upload[] = BACKEND_ENABLED
    ? liveMedia.map((i) => ({
        id: i.id,
        kind: i.kind,
        name: i.name,
        url: i.url,
        model: i.model || undefined,
        size: i.bytes,
        uses: i.uses,
        addedAt: Date.parse(i.created_at),
        fav: i.favourite,
        folderId: i.folder_id,
        duration: i.duration_seconds,
        width: i.width,
        height: i.height,
        container: i.container,
        codec: i.codec || i.audio_codec,
        character: i.character ?? null,
      }))
    : getLibraryImages().map((i) => ({
        id: i.id,
        kind: "image",
        name: i.name,
        url: i.src,
        model: i.model,
        size: i.size,
        uses: i.uses,
        addedAt: i.addedAt,
        fav: i.fav,
      }));
  return kind ? all.filter((u) => u.kind === kind) : all;
}

/** Renames an upload. The name is the only thing a customer can edit about one. */
export async function renameUpload(id: string, name: string): Promise<void> {
  if (BACKEND_ENABLED) {
    await updateLibraryImage(id, { name });
    await refreshLibrary();
    return;
  }
  saveLibraryImages(getLibraryImages().map((i) => (i.id === id ? { ...i, name } : i)));
  notify("library");
}

/**
 * Uploads files of any kind the backend accepts; demo mode keeps images only.
 *
 * One file failing must not hide the ones that worked - picking five clips and
 * having the big one refused should still leave four in the library - so every
 * upload is settled, the library is refreshed either way, and the first failure
 * is what the caller reports.
 */
export async function uploadFiles(
  files: File[],
  opts: { folderId?: string; character?: "virtual" | "person" } = {},
): Promise<void> {
  const consent = opts.character
    ? {
        has_permission: true,
        asserted: opts.character === "person" ? "the subject has agreed to this use" : "not a real person",
        at: new Date().toISOString(),
      }
    : undefined;
  const results = await Promise.allSettled(
    files.map((file) =>
      hubUploadLibraryMedia(file, {
        name: file.name,
        folderId: opts.folderId,
        character: opts.character,
        consent,
      }),
    ),
  );
  await refreshLibrary().catch(() => {});
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) throw failed.reason;
}

/**
 * Turns a stored image into a portrait, or stops it being one.
 *
 * Both directions reach the provider. Registering queues it for their review;
 * unregistering removes it from them immediately and cannot be undone - the
 * file itself is untouched either way, so changing your mind costs the
 * preparation again and nothing else.
 */
export async function setUploadPortrait(
  id: string,
  kind: "virtual" | "person" | null,
): Promise<void> {
  if (kind) {
    await registerCharacter(id, {
      kind,
      consent: {
        has_permission: true,
        asserted: kind === "person" ? "the subject has agreed to this use" : "not a real person",
        at: new Date().toISOString(),
      },
    });
  } else {
    await unregisterCharacter(id);
  }
  await refreshLibrary();
}

/** Library limits and the storage price, as the backend reports them. */
export function getLibraryLimits(): LibraryLimits | null {
  return liveLimits;
}

/** Folders in the shape the library page uses, with their image ids filled in. */
export function getLibraryFolders(): { id: string; name: string; imageIds: string[] }[] {
  return liveFolders.map((f) => ({
    id: f.id,
    name: f.name,
    imageIds: Object.entries(folderOfImage)
      .filter(([, folderId]) => folderId === f.id)
      .map(([imageId]) => imageId),
  }));
}

export async function uploadLibraryImage(file: Blob, opts: { name?: string; model?: string; folderId?: string } = {}) {
  const saved = await hubUploadLibraryImage(file, opts);
  await refreshLibrary();
  return saved;
}

export async function removeLibraryImages(ids: string[], confirm = false): Promise<void> {
  // The backend refuses (409) a file some generation was made from unless the
  // caller has been told and said yes; the page turns that into a question.
  await Promise.all(ids.map((id) => deleteLibraryImage(id, confirm)));
  await refreshLibrary();
}

export async function setImageFavourite(id: string, favourite: boolean): Promise<void> {
  await updateLibraryImage(id, { favourite });
  await refreshLibrary();
}

export async function setImageFolder(id: string, folderId: string | null): Promise<void> {
  await updateLibraryImage(id, { folder_id: folderId });
  await refreshLibrary();
}

export async function markImageUsed(id: string): Promise<void> {
  await updateLibraryImage(id, { used: true });
}

export async function saveLibraryOrder(ids: string[]): Promise<void> {
  await setLibraryOrder(ids);
}

export async function addLibraryFolder(name: string): Promise<void> {
  await createLibraryFolder(name);
  await refreshLibrary();
}

export async function renameLibraryFolderByName(id: string, name: string): Promise<void> {
  await renameLibraryFolder(id, name);
  await refreshLibrary();
}

export async function removeLibraryFolder(id: string): Promise<void> {
  await deleteLibraryFolder(id);
  await refreshLibrary();
}

/** A URL a provider can fetch, for handing a stored image to a generation. */
export async function libraryImageProviderUrl(id: string): Promise<string> {
  return (await libraryImageLink(id)).url;
}
