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
