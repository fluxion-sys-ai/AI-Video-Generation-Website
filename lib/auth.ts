"use client";

// Frontend-only mock. Nothing here is real auth — do not trust client-side.
const AUTH_KEY = "fluxion.signedIn";
const DRAFT_KEY = "fluxion.genDraft";

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}

export function signIn() {
  localStorage.setItem(AUTH_KEY, "1");
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
}

// Save/restore the generation form so a sign-in detour doesn't lose input.
export function saveDraft(draft: unknown) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
