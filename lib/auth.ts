"use client";

// Sign-in state. With NEXT_PUBLIC_BACKEND=1 accounts are real: the hub verifies
// the email, holds the session, and resets passwords; this module mirrors the
// profile in localStorage so the synchronous getters below keep working.
// Without a backend it is a frontend-only mock - do not trust client-side.
import {
  ApiError,
  BACKEND_ENABLED,
  deleteAccount as hubDeleteAccount,
  getSelf,
  hasSession,
  login,
  logout,
  registerWithEmail,
  resetPassword,
  sendVerificationCode,
  updateDisplayName,
  type HubUser,
} from "./hub";
const AUTH_KEY = "fluxion.signedIn";
const USER_KEY = "fluxion.user";
const DRAFT_KEY = "fluxion.genDraft";

export type User = { name: string; username: string; email: string; avatar?: string };

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(AUTH_KEY) !== "1") return false;
  // A leftover mock sign-in does not count once the backend is on.
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

// ---- real accounts (backend mode) ------------------------------------------------

function storeHubUser(hub: HubUser, overrides: Partial<User> = {}): User {
  const existing = getUser();
  const same = existing?.username === hub.username ? existing : null;
  const user: User = {
    // The account's own name comes first, ahead of whatever this browser
    // remembers: a name changed on one device should follow the customer to
    // the next one, not be overruled by a stale local copy. The hub sets
    // display_name to the username at registration, so that value means
    // "never set" and the email is a kinder guess.
    name:
      overrides.name ||
      (hub.display_name && hub.display_name !== hub.username ? hub.display_name : "") ||
      same?.name ||
      nameFromEmail(hub.email || hub.username),
    username: hub.username,
    email: hub.email || overrides.email || same?.email || "",
    avatar: overrides.avatar ?? same?.avatar,
  };
  localStorage.setItem(AUTH_KEY, "1");
  setUser(user);
  return user;
}

/**
 * Brings this browser's copy of the customer in line with the account.
 *
 * The name, email and username live on the account; a browser only caches
 * them. Anything that already fetches the account can pass it through here and
 * the cache heals itself - which is what makes a name set on one device show
 * up on the next, and what stops a cleared browser from inventing a name from
 * the email address.
 */
export function reconcileUser(hub: HubUser): User {
  return storeHubUser(hub);
}

/** Password sign-in with an email address (or the mock when the backend is off). */
export async function signInWithPassword(identifier: string, password: string): Promise<User> {
  if (!BACKEND_ENABLED) {
    signIn(identifier);
    return getUser() as User;
  }
  return storeHubUser(await login(identifier.trim().toLowerCase(), password));
}

/** Step 1 of signup: email a verification code. */
export async function startEmailSignup(email: string): Promise<void> {
  if (!BACKEND_ENABLED) return;
  if (!/\S+@\S+\.\S+/.test(email)) throw new ApiError("Enter a valid email address.", 400);
  await sendVerificationCode(email);
}

/**
 * Step 2 of signup: create the account with the emailed code, then sign in.
 * The hub needs a unique username, so one is derived from the email; customers
 * never need it because they sign in with their email address.
 */
export async function completeEmailSignup(input: { email: string; password: string; code: string; name?: string }): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || nameFromEmail(email);
  if (!BACKEND_ENABLED) {
    signIn(email);
    const user = { name, username: usernameFromEmail(email), email };
    setUser(user);
    return user;
  }
  if (input.password.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  if (!input.code.trim()) throw new ApiError("Enter the code we emailed you.", 400);
  const username = `${usernameFromEmail(email).slice(0, 12)}${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
  await registerWithEmail({ username, password: input.password, email, code: input.code });
  const hub = await login(email, input.password);
  // The hub sets display_name to the generated username at registration and
  // ignores anything else the register call carries, so the name a customer
  // typed has to be saved right afterwards. Without this it lived in one
  // browser only, and the next device showed a name derived from their email
  // instead - the account appearing to rename itself.
  try {
    await updateDisplayName(name);
    hub.display_name = name;
  } catch {
    // The account exists and they are signed in; a name that did not save is
    // not a reason to fail the signup. Profile -> Account can set it later.
  }
  return storeHubUser(hub, { name, email });
}

/** Completes a reset link: sets the chosen password and signs in. */
export async function completePasswordReset(email: string, token: string, newPassword: string): Promise<User> {
  if (newPassword.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  return storeHubUser(await resetPassword(email, token, newPassword), { email: email.trim().toLowerCase() });
}

/** Saves the display name to the hub (and locally). */
export async function saveDisplayName(name: string): Promise<void> {
  const trimmed = name.trim().slice(0, 20) || "Creator";
  const user = getUser();
  if (user) setUser({ ...user, name: trimmed });
  if (BACKEND_ENABLED) await updateDisplayName(trimmed);
}

/** Deletes stored media and the account itself. Needs the current password. */
export async function deleteAccount(password: string): Promise<void> {
  if (BACKEND_ENABLED) await hubDeleteAccount(password);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Latest account data (balance, usage) from the hub. Null in demo mode or when signed out. */
export async function fetchAccount(): Promise<HubUser | null> {
  if (!BACKEND_ENABLED || !isSignedIn()) return null;
  try {
    return await getSelf();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) localStorage.removeItem(AUTH_KEY);
    throw err;
  }
}
