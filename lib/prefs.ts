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

// Theme (dark default, light matches the Fluxion site).
const THEME_KEY = "fluxion.theme";
export type Theme = "dark" | "light";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}

export function applyTheme(t: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", t === "light");
}
