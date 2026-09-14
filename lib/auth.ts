"use client";

// Session state for the site. With NEXT_PUBLIC_BACKEND=1 the account lives in
// the model hub (lib/api.ts) and this module mirrors the profile in
// localStorage for synchronous reads. Without it, everything is a
// frontend-only mock - do not trust client-side state.
import {
  ApiError,
  BACKEND_ENABLED,
  getSelf,
  hasSession,
  login,
  logout,
  register,
  registerWithEmail,
  resetPassword,
  sendVerificationCode,
  type HubUser,
} from "@/lib/api";

const AUTH_KEY = "fluxion.signedIn";
const USER_KEY = "fluxion.user";
const DRAFT_KEY = "fluxion.genDraft";

export type User = { name: string; username: string; email: string; avatar?: string };

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(AUTH_KEY) !== "1") return false;
  // A leftover mock sign-in does not count once the real backend is on.
  return !BACKEND_ENABLED || hasSession();
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

// Mock sign-in, used when the backend is off.
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
  if (BACKEND_ENABLED) void logout();
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

// ---- real accounts (model hub) ----------------------------------------------

function storeHubUser(hub: HubUser, overrides: Partial<User> = {}): User {
  const existing = getUser();
  const same = existing?.username === hub.username ? existing : null;
  const user: User = {
    name:
      overrides.name ||
      same?.name ||
      (hub.display_name && hub.display_name !== hub.username ? hub.display_name : nameFromEmail(hub.email || hub.username)),
    username: hub.username,
    email: hub.email || overrides.email || same?.email || "",
    avatar: same?.avatar,
  };
  localStorage.setItem(AUTH_KEY, "1");
  setUser(user);
  return user;
}

/** Password sign-in against the hub, or the mock when the backend is off. */
export async function signInWithPassword(identifier: string, password: string): Promise<User> {
  if (!BACKEND_ENABLED) {
    signIn(identifier);
    return getUser() as User;
  }
  const hub = await login(identifier.trim(), password);
  return storeHubUser(hub);
}

const USERNAME_TAKEN = /exist|已存在/i;

/**
 * Creates a hub account from an email and password, then signs in. Hub
 * usernames are at most 20 characters, so one is derived from the email, with
 * a numeric suffix if taken. The hub stores the email only when email
 * verification is enabled; until then users sign in with the username.
 */
export async function signUpWithPassword(input: { email: string; password: string; name?: string }): Promise<User> {
  const email = input.email.trim();
  const name = input.name?.trim() || nameFromEmail(email);
  if (!BACKEND_ENABLED) {
    signIn(email);
    const user = { name, username: usernameFromEmail(email), email };
    setUser(user);
    return user;
  }
  if (input.password.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  const base = usernameFromEmail(email);
  let username = "";
  for (let attempt = 0; attempt < 4 && !username; attempt++) {
    const candidate = attempt === 0 ? base.slice(0, 20) : `${base.slice(0, 15)}${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await register(candidate, input.password);
      username = candidate;
    } catch (err) {
      if (!(err instanceof ApiError && USERNAME_TAKEN.test(err.message)) || attempt === 3) throw err;
    }
  }
  const hub = await login(username, input.password);
  return storeHubUser(hub, { name, email });
}

/** Step 1 of email signup: email the verification code. No-op in mock mode. */
export async function startEmailSignup(email: string): Promise<void> {
  if (!BACKEND_ENABLED) return;
  if (!/\S+@\S+\.\S+/.test(email)) throw new ApiError("Enter a valid email address.", 400);
  await sendVerificationCode(email);
}

/**
 * Step 2 of email signup: create the account with the emailed code, then sign in by email.
 * The hub still needs a unique username, so a random one is derived from the email;
 * users never need it because they sign in with their email.
 */
export async function completeEmailSignup(input: { email: string; password: string; code: string; name?: string }): Promise<User> {
  if (!BACKEND_ENABLED) return signUpWithPassword(input);
  const email = input.email.trim().toLowerCase();
  if (input.password.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  if (!input.code.trim()) throw new ApiError("Enter the code we emailed you.", 400);
  const username = `${usernameFromEmail(email).slice(0, 12)}${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
  await registerWithEmail({ username, password: input.password, email, code: input.code });
  const hub = await login(email, input.password);
  return storeHubUser(hub, { name: input.name?.trim() || nameFromEmail(email), email });
}

/** Completes a password reset link and signs the user in with the new password. */
export async function completePasswordReset(email: string, token: string, newPassword: string): Promise<User> {
  if (newPassword.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  const hub = await resetPassword(email, token, newPassword);
  return storeHubUser(hub, { email: email.trim().toLowerCase() });
}

/** Latest account data (balance, usage) from the hub. Null in mock mode or when signed out. */
export async function fetchAccount(): Promise<HubUser | null> {
  if (!BACKEND_ENABLED || !isSignedIn()) return null;
  try {
    return await getSelf();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) localStorage.removeItem(AUTH_KEY);
    throw err;
  }
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
