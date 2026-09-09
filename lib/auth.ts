"use client";

// Frontend-only mock. Nothing here is real auth - do not trust client-side.
const AUTH_KEY = "fluxion.signedIn";
const USER_KEY = "fluxion.user";
const DRAFT_KEY = "fluxion.genDraft";

export type User = { name: string; username: string; email: string; avatar?: string };

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}

function localPart(email: string): string {
  return email.split("@")[0] || "creator";
}
function nameFromEmail(email: string): string {
  const local = localPart(email).replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "Creator";
}
function usernameFromEmail(email: string): string {
  return localPart(email).replace(/[^a-z0-9]/gi, "").toLowerCase() || "creator";
}

export function signIn(email?: string) {
  localStorage.setItem(AUTH_KEY, "1");
  if (!localStorage.getItem(USER_KEY)) {
    const e = email || "you@fluxion.ai";
    setUser({ name: nameFromEmail(e), username: usernameFromEmail(e), email: e });
  }
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Partial<User>;
    return {
      name: u.name || "Creator",
      username: u.username || usernameFromEmail(u.email || "creator"),
      email: u.email || "you@fluxion.ai",
      avatar: u.avatar,
    };
  } catch {
    return null;
  }
}

export function setUser(u: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
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
