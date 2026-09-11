"use client";

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

// Persisted library images. Seeded with samples by the library on first load,
// then appended to whenever the user uploads — including uploads made inside a
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
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(LIB_IMAGES_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function saveLibraryImages(list: LibImage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LIB_IMAGES_KEY, JSON.stringify(list));
  } catch {
    /* quota / unavailable — non-critical for the mock */
  }
}
// Prepend new uploads so the newest show first.
export function addLibraryImages(items: LibImage[]) {
  saveLibraryImages([...items, ...getLibraryImages()]);
}

// Hand-off of library images to a model's playground. The library writes the
// selected images here, then routes to /generate?model=…; the playground reads
// and clears them on load (see app/generate/page.tsx).
const PENDING_IMAGES_KEY = "fluxion.pendingImages";
export type PendingImage = { url: string; name: string };

export function setPendingImages(list: PendingImage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_IMAGES_KEY, JSON.stringify(list));
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
// which every design token keys off of — see app/globals.css).
export function applyTheme(t: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", resolveTheme(t) === "light");
}

// Brand "skin" — an independent axis from dark/light. Overrides the whole token
// palette + fonts + radii site-wide via a class on <html> (see app/globals.css):
//   - "og"        → the original Fluxion look (dark/light theme still applies)
//   - "editorial" → warm frosted-glass, chunky black headlines (its own palette)
//   - "luxury"    → navy + gold, serif headlines, wave dividers (its own palette)
//   - "playful"   → white + blocky pastels, rounded friendly type, yellow pills
// This is a preview mechanism so all skins can be compared across the real site.
const SKIN_KEY = "fluxion.skin";
export type Skin = "og" | "editorial" | "luxury" | "playful";

export function getSkin(): Skin {
  if (typeof window === "undefined") return "og";
  const v = localStorage.getItem(SKIN_KEY);
  return v === "editorial" || v === "luxury" || v === "playful" ? v : "og";
}

// Persist the skin and reflect it on <html> immediately (toggling the skin class
// that every alternate-theme token keys off of).
export function applySkin(skin: Skin) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SKIN_KEY, skin);
  const el = document.documentElement;
  el.classList.remove("skin-editorial", "skin-luxury", "skin-playful");
  if (skin !== "og") el.classList.add(`skin-${skin}`);
  // Notify React components (useSkin) so layouts — not just CSS — re-render live.
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
