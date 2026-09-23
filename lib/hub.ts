"use client";

/**
 * lib/hub.ts, transport for the Fluxion backend (fluxion-sys-ai/api-gateway).
 *
 * The UI never imports this directly. It is the plumbing behind the seams in
 * BACKEND.md: lib/api.ts (generation), lib/auth.ts (accounts), lib/billing.ts
 * (credits), lib/generations.ts (history), lib/prefs.ts (library), and
 * lib/models.ts (catalog).
 *
 * The site and the hub share one origin: the reverse proxy sends /api and /v1
 * to new-api (under `next dev`, next.config.ts rewrites do the same). That keeps
 * new-api's SameSite=Strict refresh cookie working and avoids CORS, which
 * new-api does not enable on its account routes.
 *
 * Two credentials:
 *  - Account routes (/api/...) take a 15-minute access token from login. It is
 *    kept in localStorage and renewed with the httpOnly refresh cookie.
 *  - Generation routes (/v1/videos) take an API key. The site creates one per
 *    user, named "fluxion-web", on first use and caches it locally.
 */

export const BACKEND_ENABLED = process.env.NEXT_PUBLIC_BACKEND === "1";

// new-api default: 500,000 quota units per US dollar. The site prices 1 credit at $0.01.
export const QUOTA_PER_USD = 500_000;
export const USD_PER_CREDIT = 0.01;
export const quotaToUsd = (quota: number) => quota / QUOTA_PER_USD;

const SESSION_KEY = "fluxion.session";
const API_KEY_KEY = "fluxion.apiKey";
const PROMPTS_KEY = "fluxion.prompts";
const WEB_KEY_NAME = "fluxion-web";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type HubUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  quota: number;
  used_quota: number;
  request_count: number;
  group: string;
  /** JSON string of notification settings (quota_warning_threshold, notify_type, ...). */
  setting?: string;
};

type Session = { accessToken: string; expiresAt: number; userId: number };
type AuthData = { access_token: string; access_expires_at: number; user: HubUser };
type Envelope<T> = { success: boolean; message?: string; code?: string; data?: T };
type Page<T> = { items: T[] | null; total: number; page: number; page_size: number };

// ---- storage ---------------------------------------------------------------

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the session simply won't persist */
  }
}

function storeSession(data: AuthData): Session {
  const session = { accessToken: data.access_token, expiresAt: data.access_expires_at, userId: data.user.id };
  writeJSON(SESSION_KEY, session);
  return session;
}

/** Forget the hub session and cached API key on this device. */
export function clearLocalAuth() {
  writeJSON(SESSION_KEY, null);
  writeJSON(API_KEY_KEY, null);
}

export function hasSession(): boolean {
  return readJSON<Session>(SESSION_KEY) !== null;
}

// ---- HTTP helpers ----------------------------------------------------------

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// new-api appends "(request id: ...)" to relay error messages.
const cleanMessage = (message: string) => message.replace(/\s*\(request id: [^)]*\)\s*$/, "");

function errorFrom(res: Response, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const b = body as { message?: string; code?: string; error?: { message?: string; code?: string } };
    const message = b.error?.message || b.message;
    const code = b.error?.code || b.code;
    // A code we can say something useful about beats the upstream's own wording.
    if (code !== "AUTH_SESSION_LIMIT" && message) return new ApiError(cleanMessage(message), res.status, code);
  }
  if (res.status === 429) return new ApiError("Too many requests. Try again in a minute.", 429);
  // The hub answers a session-limit refusal with the bare word "Conflict",
  // which tells nobody anything - and it is the one refusal a person meets
  // while simply trying to log in.
  if (res.status === 409) {
    return new ApiError(
      "This account has opened too many sessions recently. Sign out on another device, or try again later.",
      409,
      "AUTH_SESSION_LIMIT",
    );
  }
  return new ApiError(`Request failed (${res.status}).`, res.status);
}

let refreshing: Promise<Session | null> | null = null;

/**
 * Trades the refresh cookie for a new access token. Concurrent callers share
 * one request.
 *
 * Returns null only when the hub *answers* that the session is over. A request
 * that never got an answer - a navigation cancelled it, the network blinked -
 * throws instead, because "I could not ask" is not "you are signed out".
 * Treating the two alike logged customers out mid-navigation: the aborted
 * refresh showed up in the gateway log as a 499 and the next page load went to
 * the login screen.
 */
async function refreshSession(): Promise<Session | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch("/api/user/auth/refresh", { method: "POST", credentials: "same-origin" });
      const body = (await parseBody(res)) as Envelope<AuthData> | null;
      if (res.status === 401 || res.status === 403) return null; // the hub says it is over
      if (!res.ok || !body?.success || !body.data?.access_token) {
        throw new ApiError(`Could not renew the session (${res.status}).`, res.status);
      }
      return storeSession(body.data);
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

/** Fetch with the session access token, renewing it once via the refresh cookie on expiry or 401. */
async function authedFetch(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<Response> {
  let session = readJSON<Session>(SESSION_KEY);
  if (!session) throw new ApiError("Please log in.", 401);
  if (session.expiresAt * 1000 - Date.now() < 30_000) {
    session = await refreshSession();
    if (!session) {
      clearLocalAuth();
      throw new ApiError("Your session expired. Please log in again.", 401);
    }
  }
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const send = (s: Session) =>
    fetch(path, {
      method,
      credentials: "same-origin",
      headers: {
        Authorization: `Bearer ${s.accessToken}`,
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  let res = await send(session);
  if (res.status === 401) {
    const renewed = await refreshSession();
    if (!renewed) {
      clearLocalAuth();
      throw new ApiError("Your session expired. Please log in again.", 401);
    }
    res = await send(renewed);
  }
  return res;
}

/** Account API call (session auth). Unwraps new-api's {success, message, data} envelope. */
async function account<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authedFetch(method, path, body);
  const payload = (await parseBody(res)) as Envelope<T> | null;
  if (!res.ok || !payload || typeof payload !== "object" || !payload.success) throw errorFrom(res, payload);
  return payload.data as T;
}

/** Sidecar call (session auth, plain JSON responses). */
async function sidecar<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authedFetch(method, path, body);
  const payload = await parseBody(res);
  if (!res.ok) {
    const raw = payload && typeof payload === "object" ? (payload as { detail?: unknown }).detail : undefined;
    // A validation refusal comes back as {message, problems}; plain errors as a string.
    const detail =
      typeof raw === "string"
        ? raw
        : raw && typeof raw === "object"
          ? String((raw as { message?: unknown }).message || "")
          : "";
    throw new ApiError(detail || `Request failed (${res.status}).`, res.status);
  }
  return payload as T;
}

async function publicGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  const payload = (await parseBody(res)) as Envelope<T> | null;
  if (!res.ok || !payload || typeof payload !== "object" || !payload.success) throw errorFrom(res, payload);
  return payload.data as T;
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await parseBody(res)) as Envelope<T> | null;
  if (!res.ok || !payload || typeof payload !== "object" || !payload.success) throw errorFrom(res, payload);
  return payload.data as T;
}

// ---- account ---------------------------------------------------------------

/** Password login with a username or (when the hub stores emails) an email address. */
export async function login(identifier: string, password: string): Promise<HubUser> {
  const data = await publicPost<AuthData | Record<string, unknown>>("/api/user/login", { username: identifier, password });
  if (!data || !("access_token" in data) || !data.access_token) {
    throw new ApiError("This account uses two-factor sign-in, which the web app does not support yet.", 403, "2fa_required");
  }
  const auth = data as AuthData;
  storeSession(auth);
  return auth.user;
}

export async function register(username: string, password: string): Promise<void> {
  await publicPost<unknown>("/api/user/register", { username, password });
}

/** Emails a 6-character verification code (the hub requires it when email verification is on). */
export async function sendVerificationCode(email: string): Promise<void> {
  await publicGet<unknown>(`/api/verification?email=${encodeURIComponent(email.trim().toLowerCase())}`);
}

/** Registers with a verified email. The hub still requires a unique username (max 20 chars). */
export async function registerWithEmail(input: { username: string; password: string; email: string; code: string }): Promise<void> {
  await publicPost<unknown>("/api/user/register", {
    username: input.username,
    password: input.password,
    email: input.email.trim().toLowerCase(),
    verification_code: input.code.trim(),
  });
}

/** Emails a password reset link to /user/reset?email=&token= (always succeeds, to avoid revealing accounts). */
export async function requestPasswordReset(email: string): Promise<void> {
  await publicGet<unknown>(`/api/reset_password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
}

/** Re-verifies the current password for one sensitive operation; returns the X-Security-Proof value. */
async function securityProof(scope: string, password: string): Promise<string> {
  const data = await account<{ proof_token: string }>("POST", "/api/verify", { method: "password", scope, password });
  return data.proof_token;
}

/** Changes the signed-in user's password. The hub rotates the session, so the new token is stored. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const proof = await securityProof("account.password.change", currentPassword);
  const res = await authedFetch("PUT", "/api/user/self", { password: newPassword, original_password: currentPassword }, { "X-Security-Proof": proof });
  const payload = (await parseBody(res)) as Envelope<{ access_token?: string; access_expires_at?: number }> | null;
  if (!res.ok || !payload?.success) throw errorFrom(res, payload);
  const session = readJSON<Session>(SESSION_KEY);
  if (session && payload.data?.access_token) {
    writeJSON(SESSION_KEY, { ...session, accessToken: payload.data.access_token, expiresAt: payload.data.access_expires_at ?? session.expiresAt });
  }
}

/**
 * Completes a reset link. new-api answers a valid token with a generated password, so
 * the site signs in with it and immediately sets the password the user chose.
 */
export async function resetPassword(email: string, token: string, newPassword: string): Promise<HubUser> {
  const normalized = email.trim().toLowerCase();
  const generated = await publicPost<string>("/api/user/reset", { email: normalized, token });
  const user = await login(normalized, generated);
  await changePassword(generated, newPassword);
  return user;
}

export async function logout(): Promise<void> {
  const session = readJSON<Session>(SESSION_KEY);
  clearLocalAuth();
  if (!session) return;
  try {
    await fetch("/api/user/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  } catch {
    /* already signed out locally */
  }
}

export function getSelf(): Promise<HubUser> {
  return account<HubUser>("GET", "/api/user/self");
}

// ---- API key for generation --------------------------------------------------

type TokenRow = { id: number; name: string; status: number };

async function findWebKey(): Promise<TokenRow | undefined> {
  const page = await account<Page<TokenRow>>("GET", "/api/token/?p=1&page_size=100");
  return (page.items ?? []).find((t) => t.name === WEB_KEY_NAME && t.status === 1);
}

async function apiKey(): Promise<string> {
  const session = readJSON<Session>(SESSION_KEY);
  if (!session) throw new ApiError("Please log in.", 401);
  const cached = readJSON<{ userId: number; key: string }>(API_KEY_KEY);
  if (cached && cached.userId === session.userId) return cached.key;

  let row = await findWebKey();
  if (!row) {
    await account("POST", "/api/token/", { name: WEB_KEY_NAME, remain_quota: 0, unlimited_quota: true, expired_time: -1 });
    row = await findWebKey();
  }
  if (!row) throw new ApiError("Could not create an API key for this account.", 500);
  const data = await account<{ key: string } | string>("POST", `/api/token/${row.id}/key`);
  const raw = typeof data === "string" ? data : data.key;
  const key = raw.startsWith("sk-") ? raw : `sk-${raw}`;
  writeJSON(API_KEY_KEY, { userId: session.userId, key });
  return key;
}

// ---- legal documents and consent --------------------------------------------

export type LegalDocument = { slug: string; title: string; markdown: string; version: string; published: boolean };

/** The sidecar answers with the document itself, not the hub's {success, data} envelope. */
async function legalGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  const body = await parseBody(res);
  if (!res.ok || !body) throw errorFrom(res, body);
  return body as T;
}

export function getLegalDocument(slug: string): Promise<LegalDocument> {
  return legalGet<LegalDocument>(`/legal/${slug}`);
}

export function getLegalDocuments(): Promise<{ documents: LegalDocument[] }> {
  return legalGet<{ documents: LegalDocument[] }>("/legal");
}

/** Records that the signed-in account accepted the documents shown at signup. */
export function acceptLegal(documents: string[] = ["terms", "privacy", "refunds"]): Promise<unknown> {
  return sidecar("POST", "/legal/consent", { documents });
}

// ---- developer API keys (Profile -> API keys) --------------------------------

export type ApiKeyRow = {
  id: number;
  name: string;
  /** The hub's own masked form, as the credential is actually written: "sk-gdSL**********kRXS". */
  masked: string;
  /** 1 active, 2 disabled, 3 expired, 4 out of quota. */
  status: number;
  createdAt: number;
  /** 0 when the key has never been used. */
  lastUsedAt: number;
  spentUsd: number;
};

type FullTokenRow = TokenRow & {
  key?: string;
  created_time?: number;
  accessed_time?: number;
  used_quota?: number;
};

function keyRow(row: FullTokenRow): ApiKeyRow {
  return {
    id: row.id,
    name: row.name,
    // The hub stores a key without the prefix that every request carries, so
    // its masked form is missing the first three characters of the thing a
    // customer is looking at. Showing it without them invites someone to type
    // out a credential that will never work.
    masked: row.key ? (row.key.startsWith("sk-") ? row.key : `sk-${row.key}`) : "",
    status: row.status,
    createdAt: (row.created_time ?? 0) * 1000,
    lastUsedAt: (row.accessed_time ?? 0) * 1000,
    spentUsd: quotaToUsd(row.used_quota ?? 0),
  };
}

/** The developer's own keys, newest first. The site's internal key is not listed. */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const page = await account<Page<FullTokenRow>>("GET", "/api/token/?p=1&page_size=100");
  return (page.items ?? [])
    .filter((row) => row.name !== WEB_KEY_NAME)
    .map(keyRow)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** A label nobody has used yet: key-1, key-2, and so on. */
function nextKeyName(existing: ApiKeyRow[]): string {
  const taken = new Set(existing.map((r) => r.name));
  for (let n = 1; n <= 999; n++) {
    const candidate = `key-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `key-${Date.now()}`;
}

/**
 * Creates a key that spends the account balance, with no expiry, and returns
 * its secret. The hub generates the secret; the name is only a label, so one is
 * chosen here when the customer does not care to.
 *
 * The hub's create call returns nothing, so the new row is found by its name:
 * that only works if the name is unique, which is why a duplicate is renamed
 * rather than accepted.
 */
export async function createApiKey(name = ""): Promise<{ row: ApiKeyRow; secret: string }> {
  const existing = await listApiKeys();
  let clean = name.trim();
  if (clean === WEB_KEY_NAME) throw new ApiError(`"${WEB_KEY_NAME}" is reserved for this website.`, 400);
  if (!clean || existing.some((r) => r.name === clean)) clean = nextKeyName(existing);

  await account("POST", "/api/token/", { name: clean, remain_quota: 0, unlimited_quota: true, expired_time: -1 });
  const rows = await listApiKeys();
  const row = rows.find((r) => r.name === clean);
  if (!row) throw new ApiError("The key was created but could not be read back.", 500);
  return { row, secret: await revealApiKey(row.id) };
}

/** The full secret for one of the account's keys. */
export async function revealApiKey(id: number): Promise<string> {
  const data = await account<{ key: string } | string>("POST", `/api/token/${id}/key`);
  const raw = typeof data === "string" ? data : data.key;
  return raw.startsWith("sk-") ? raw : `sk-${raw}`;
}

export async function deleteApiKey(id: number): Promise<void> {
  await account("DELETE", `/api/token/${id}`);
}

/** Disables a key without deleting it (status 2), or re-enables it (status 1). */
export async function setApiKeyEnabled(id: number, enabled: boolean): Promise<void> {
  await account("PUT", "/api/token/?status_only=true", { id, status: enabled ? 1 : 2 });
}

/** Generation API call (API-key auth). Relay errors use {error: {message, code}}. */
async function relay<T>(method: string, path: string, init: { json?: unknown; form?: FormData } = {}): Promise<T> {
  const send = (key: string) =>
    fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(init.json !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
    });
  let res = await send(await apiKey());
  if (res.status === 401) {
    // The cached key was revoked or deleted in the hub dashboard: mint a fresh one.
    writeJSON(API_KEY_KEY, null);
    res = await send(await apiKey());
  }
  const body = await parseBody(res);
  if (!res.ok) throw errorFrom(res, body);
  return body as T;
}

// ---- videos ------------------------------------------------------------------

export type VideoStatus = "queued" | "in_progress" | "completed" | "failed";

export type Video = {
  id: string;
  status: VideoStatus;
  progress: number;
  model: string;
  created_at: number;
  completed_at?: number;
  seconds?: string;
  size?: string;
  error?: { code?: string; message: string };
  metadata?: { prompt?: string; resolution?: string; aspect_ratio?: string; audio?: boolean; seed?: number };
};

export type VideoRequest = {
  model: string;
  prompt: string;
  seconds: number;
  resolution: string;
  aspect_ratio: string;
  audio?: boolean;
  seed?: number;
  /** Optional reference image for image-to-video, as bytes... */
  image?: Blob;
  imageName?: string;
  /** ...or as a URL the provider fetches itself (a stored library image). */
  imageUrl?: string;
  /**
   * Reference material the provider fetches: video, audio and images that drive
   * the whole clip rather than pinning its ends. The URLs come from
   * checkReferences(), which has already judged them against the model's rules.
   */
  metadata?: Record<string, unknown>;
};

function rememberPrompt(taskId: string, prompt: string) {
  // Upstreams are not required to echo the prompt, so history falls back to this.
  const prompts = readJSON<Record<string, string>>(PROMPTS_KEY) ?? {};
  prompts[taskId] = prompt;
  const ids = Object.keys(prompts);
  for (const id of ids.slice(0, Math.max(0, ids.length - 200))) delete prompts[id];
  writeJSON(PROMPTS_KEY, prompts);
}

export async function createVideo(req: VideoRequest): Promise<Video> {
  const fields: Record<string, string | number | boolean> = {
    model: req.model,
    prompt: req.prompt,
    seconds: req.seconds,
    resolution: req.resolution,
    aspect_ratio: req.aspect_ratio,
  };
  if (req.audio !== undefined) fields.audio = req.audio;
  if (req.seed !== undefined) fields.seed = req.seed;
  if (req.imageUrl) fields.image = req.imageUrl;
  const metadata = req.metadata && Object.keys(req.metadata).length ? req.metadata : null;

  let video: Video;
  if (req.image) {
    const form = new FormData();
    for (const [name, value] of Object.entries(fields)) form.append(name, String(value));
    // Multipart fields are flat, so metadata rides as JSON text; the API accepts
    // either shape (see plugins/fluxion-minimax).
    if (metadata) form.append("metadata", JSON.stringify(metadata));
    form.append("image", req.image, req.imageName || "reference.png");
    video = await relay<Video>("POST", "/v1/videos", { form });
  } else {
    video = await relay<Video>("POST", "/v1/videos", { json: metadata ? { ...fields, metadata } : fields });
  }
  rememberPrompt(video.id, req.prompt);
  return video;
}

export function getVideo(id: string): Promise<Video> {
  return relay<Video>("GET", `/v1/videos/${encodeURIComponent(id)}`);
}

// ---- images ----------------------------------------------------------------------

export type ImageRequest = {
  model: string;
  prompt: string;
  /** "2048x1152". An image has no named resolution and no separate ratio. */
  size: string;
  /** URLs the provider fetches, for image-to-image. Signed library links. */
  image?: string[];
  seed?: number;
};

export type GeneratedImage = { url?: string; b64_json?: string };

/**
 * One image, synchronously.
 *
 * Unlike a video this is not a job: the request holds open for the seconds the
 * render takes and the picture comes back in the response, so there is nothing
 * to poll and no id to poll it with. What the response does not carry is the
 * copy kept in our own storage - the backend archives each returned image on
 * the way past (sidecar/app/images.py) and it appears under /library - so the
 * URL here is the provider's own and expires.
 */
export async function createImage(req: ImageRequest): Promise<GeneratedImage[]> {
  const body: Record<string, unknown> = {
    model: req.model,
    prompt: req.prompt,
    size: req.size,
    // A URL rather than base64: the same bytes would otherwise cross the wire
    // twice, once to the browser and once to storage, for a file that can be
    // sixteen megapixels.
    response_format: "url",
  };
  if (req.image?.length) body.image = req.image;
  if (req.seed !== undefined) body.seed = req.seed;
  const out = await relay<{ data?: GeneratedImage[] }>("POST", "/v1/images/generations", { json: body });
  return out.data ?? [];
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/** Polls until the video completes or fails. Tolerates a few transient errors. */
/**
 * How long to wait before asking again.
 *
 * A fixed three seconds was most of the wait on a model that finishes in
 * sixteen: the video was ready and the page had not looked yet. But a long
 * hosted job takes three minutes, and polling that every second for three
 * minutes is a hundred and eighty requests to learn nothing. So the interval
 * follows the wait: attentive while a fast model is plausibly finishing, then
 * calmer.
 *
 * Attentive is now an eighth of a second, because the fastest model here
 * finishes in about four. Measured end to end on 2026-09-23: a five-second clip
 * took 5.2 s to make and 6.3 s to appear, and three quarters of that second was
 * this function - the job had been done since 35.2 and the next look came at
 * 35.98. A second of cadence is invisible against three minutes and very
 * visible against five.
 *
 * The window is bounded on both sides: nothing is ready before about three
 * seconds, and a job still running at twenty is not one of the fast ones. So a
 * long hosted job pays perhaps seventy extra requests, each a small GET, and
 * only in the stretch where it might have been finishing.
 */
function pollInterval(elapsedMs: number): number {
  if (elapsedMs < 3_000) return 1_000;
  if (elapsedMs < 20_000) return 125;
  if (elapsedMs < 120_000) return 2_000;
  return 4_000;
}

export async function waitForVideo(
  id: string,
  opts: { signal?: AbortSignal; onUpdate?: (video: Video) => void; intervalMs?: number } = {},
): Promise<Video> {
  let errors = 0;
  const started = Date.now();
  for (;;) {
    if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const video = await getVideo(id);
      errors = 0;
      opts.onUpdate?.(video);
      if (video.status === "completed" || video.status === "failed") return video;
    } catch (err) {
      if (err instanceof ApiError && err.status < 500 && err.status !== 429) throw err;
      if (++errors >= 4) throw err;
    }
    await sleep(opts.intervalMs ?? pollInterval(Date.now() - started), opts.signal);
  }
}

/**
 * Playable URL for a finished video. It carries a signed `access` capability,
 * so it works in <video src> and downloads without an Authorization header.
 */
/**
 * Playable URL for a video that has *just* finished, in one hop.
 *
 * `videoUrl` asks the sidecar first because a stored video is served from our
 * bucket, which is cheaper and faster to play. A video that finished a tenth of
 * a second ago is never stored yet - the provider is still uploading it, and
 * archiving follows that - so for the playground that first hop can only answer
 * "not mine yet, ask the hub", after making two calls of its own to say so.
 * Measured on a finished clip: 0.11 s spent to be told what we already knew.
 *
 * So the playground uses this, and the library keeps `videoUrl`.
 */
export async function freshVideoUrl(taskId: string): Promise<string> {
  return hubArtifactUrl(taskId);
}

async function hubArtifactUrl(taskId: string): Promise<string> {
  const data = await account<{ artifacts: { key: string; content_url: string }[] | null; legacy_content_url?: string }>(
    "GET",
    `/api/task/${encodeURIComponent(taskId)}/artifacts`,
  );
  const url = (data.artifacts ?? []).find((a) => a.key === "video")?.content_url || data.legacy_content_url;
  if (!url) throw new ApiError("This video is not available.", 404);
  // The hub builds absolute URLs from its ServerAddress; keep playback same-origin.
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

export async function videoUrl(taskId: string): Promise<string> {
  try {
    const stored = await sidecar<{ url: string; source: "gcs" | "hub" }>("GET", `/media/videos/${encodeURIComponent(taskId)}`);
    if (stored?.url) return stored.url;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    /* sidecar unavailable: fall through to the hub's own signed URL */
  }
  return hubArtifactUrl(taskId);
}

// ---- history -----------------------------------------------------------------

type TaskRow = {
  task_id: string;
  status: string;
  progress: string;
  fail_reason: string;
  submit_time: number;
  finish_time: number;
  quota: number;
  properties?: { origin_model_name?: string } | null;
  data?: { prompt?: string; seconds?: number | string; resolution?: string; aspect_ratio?: string } | null;
};

export type Generation = {
  id: string;
  model: string;
  prompt: string;
  status: VideoStatus;
  createdAt: number;
  finishedAt?: number;
  /** Charged amount; refunded (0) for failed jobs. */
  costUsd: number;
  seconds?: number;
  resolution?: string;
  error?: string;
};

const TASK_STATUS: Record<string, VideoStatus> = {
  NOT_START: "queued",
  SUBMITTED: "queued",
  QUEUED: "queued",
  IN_PROGRESS: "in_progress",
  SUCCESS: "completed",
  FAILURE: "failed",
};

export async function listGenerations(page = 1, pageSize = 24): Promise<{ items: Generation[]; total: number }> {
  const data = await account<Page<TaskRow>>("GET", `/api/task/self?p=${page}&page_size=${pageSize}`);
  const prompts = readJSON<Record<string, string>>(PROMPTS_KEY) ?? {};
  const items = (data.items ?? []).map((row): Generation => {
    const status = TASK_STATUS[row.status] ?? "queued";
    const seconds = Number(row.data?.seconds);
    return {
      id: row.task_id,
      model: row.properties?.origin_model_name || "",
      prompt: row.data?.prompt || prompts[row.task_id] || "",
      status,
      createdAt: row.submit_time,
      finishedAt: row.finish_time || undefined,
      costUsd: status === "failed" ? 0 : quotaToUsd(row.quota),
      seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : undefined,
      resolution: row.data?.resolution,
      error: status === "failed" ? row.fail_reason || "Generation failed" : undefined,
    };
  });
  return { items, total: data.total ?? 0 };
}

// ---- pricing (hub database) ----------------------------------------------------

export type HubPricing = {
  model_name: string;
  description?: string;
  tags?: string;
  billing_mode?: string;
  billing_expr?: string;
  billing_usage_schema?: import("./pricing-expr").BillingUsageSchema;
  billing_usage_examples?: { label: string; facts: Record<string, string | number> }[];
};

/** Public per-model prices as configured in the hub (only models with an enabled channel). */
export function getPricing(): Promise<HubPricing[]> {
  return publicGet<HubPricing[]>("/api/pricing");
}

// ---- billing (sidecar) -----------------------------------------------------------

export type BillingSummary = {
  currency: "USD";
  balance_usd: number;
  lifetime_spend_usd: number;
  period: { days: number; tz: string; start: string; spend_usd: number; topups_usd: number; jobs: number };
  daily: { date: string; spend_usd: number; by_model: Record<string, number> }[];
  by_model: { model: string; spend_usd: number; jobs: number; failed_jobs: number }[];
  topups: { trade_no: string; credit_usd: number; units: number; method: string; status: string; created_at: number; completed_at: number | null }[];
  /** How much of the balance is free credit an operator granted, and when the earliest of it expires. */
  promotional: { active_usd: number; next_expiry: string | null };
};

export function getBillingSummary(days = 30): Promise<BillingSummary> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return sidecar<BillingSummary>("GET", `/billing/summary?days=${days}&tz=${encodeURIComponent(tz)}`);
}

export type SecurityEvent = { occurred_at: string; event: string; success: boolean | null; ip: string | null; user_agent: string | null };

export function getSecurityActivity(limit = 20): Promise<{ items: SecurityEvent[] }> {
  return sidecar<{ items: SecurityEvent[] }>("GET", `/events/self?limit=${limit}`);
}

// ---- top-ups (Stripe Checkout through the hub) --------------------------------------

export type TopupInfo = {
  enable_stripe_topup: boolean;
  stripe_min_topup: number;
  amount_options: number[];
  discount: Record<string, number>;
};

export function getTopupInfo(): Promise<TopupInfo> {
  return account<TopupInfo>("GET", "/api/user/topup/info");
}

// The Stripe top-up endpoints answer {message: "success", data} without a `success` flag.
async function stripeCall<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch("POST", path, body);
  const payload = (await parseBody(res)) as { message?: string; data?: unknown } | null;
  if (res.ok && payload?.message === "success") return payload.data as T;
  // new-api reports payment failures in Chinese ("拉起支付失败"); only surface plain-ASCII details.
  const detail = typeof payload?.data === "string" ? payload.data : payload?.message;
  const readable = detail && detail !== "error" && /^[\x20-\x7E]+$/.test(detail) ? detail : null;
  throw new ApiError(readable ?? "Payment could not be started. Please try again in a moment.", res.status);
}

/** Price in the Stripe Price's currency for `units` credit units ($1 of credit each by default). */
export function quoteTopup(units: number): Promise<string> {
  return stripeCall<string>("/api/user/stripe/amount", { amount: units, payment_method: "stripe" });
}

/** Creates a Stripe Checkout session (card, Link, and other methods enabled in Stripe) and returns its URL. */
export async function startTopupCheckout(units: number): Promise<string> {
  const origin = window.location.origin;
  const data = await stripeCall<{ pay_link: string }>("/api/user/stripe/pay", {
    amount: units,
    payment_method: "stripe",
    success_url: `${origin}/profile/?tab=billing&topup=success`,
    cancel_url: `${origin}/profile/?tab=billing&topup=cancelled`,
  });
  return data.pay_link;
}

// ---- notifications -----------------------------------------------------------------

/** Low-balance email from the hub. new-api has no off switch; a 1-unit threshold effectively disables it. */
export function setLowBalanceAlert(input: { thresholdUsd: number; email: string; enabled: boolean }): Promise<unknown> {
  return account("PUT", "/api/user/setting", {
    notify_type: "email",
    quota_warning_threshold: input.enabled ? Math.max(1, Math.round(input.thresholdUsd * QUOTA_PER_USD)) : 1,
    notification_email: input.email,
  });
}

// ---- customer media: reference images, video, audio, folders, profile photo -------
// Stored in the backend's bucket so they follow the customer across devices.
// Uploading is permissive - any video, any audio, images we can serve - and the
// provider's rules are checked when a file is used (checkReferences below).

export type MediaKind = "image" | "video" | "audio";

/**
 * Whether the video provider has been told about this image, and how that went.
 *
 * Present only on an image somebody registered as a reusable character, which
 * is almost none of them. It is a note on the file rather than a separate kind
 * of object: registering buys pre-authorisation, not a new kind of input.
 */
export type CharacterState = {
  id: string;
  status: "pending" | "processing" | "ready" | "failed";
  error: { code: string; message: string } | null;
  created_at?: string;
  ready_at?: string | null;
};

export type LibraryItem = {
  id: string;
  kind: MediaKind;
  /** Set when this image is registered with the provider. Usually absent. */
  character?: CharacterState | null;
  name: string;
  content_type: string;
  bytes: number;
  model: string | null;
  folder_id: string | null;
  favourite: boolean;
  uses: number;
  /** What the file measures, as far as the backend could read it. Null is "unknown". */
  container: string;
  codec: string;
  audio_codec: string;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  /** Short-lived URL for display. */
  url: string;
};

/** The old name, kept so image-only callers read naturally. */
export type LibraryImage = LibraryItem;

export type LibraryFolder = { id: string; name: string; created_at: string };

export type LibraryLimits = {
  max_images: number;
  max_videos: number;
  max_audios: number;
  max_bytes_per_image: number;
  max_bytes_per_video: number;
  max_bytes_per_audio: number;
  max_bytes_total: number;
  /** What a stored gigabyte costs per month, at the bucket's own price. */
  storage_usd_per_gb_month: number;
};

export type LibraryListing = {
  items: LibraryItem[];
  folders: LibraryFolder[];
  limits: LibraryLimits;
  usage?: Partial<Record<MediaKind, { count: number; bytes: number }>>;
};

export function listLibrary(kind?: MediaKind): Promise<LibraryListing> {
  return sidecar<LibraryListing>("GET", `/media/library/media${kind ? `?kind=${kind}` : ""}`);
}

export function uploadLibraryMedia(
  file: Blob,
  opts: {
    name?: string;
    model?: string;
    folderId?: string;
    /**
     * Register this image with the provider as it is stored. Saying what a
     * file is while you have it in hand beats uploading, finding it, picking
     * it and then marking it.
     */
    character?: boolean;
    consent?: Record<string, unknown>;
  } = {},
): Promise<LibraryItem> {
  const form = new FormData();
  form.append("file", file, opts.name || "upload");
  if (opts.model) form.append("model", opts.model);
  if (opts.folderId) form.append("folder_id", opts.folderId);
  if (opts.character) {
    // A portrait is a portrait: the provider's two libraries turned out to be
    // one, so the customer is no longer asked to categorise a face.
    form.append("character", "portrait");
    form.append("consent", JSON.stringify(opts.consent ?? {}));
  }
  return sidecar<LibraryItem>("POST", "/media/library/media", form);
}

/**
 * Everything this account holds, uploaded and generated, in one listing.
 *
 * `source` separates the two, `kind` narrows by file type, and `character`
 * filters to images registered with the provider. Each row says what it is
 * rather than leaving the caller to infer it: source, kind, bytes,
 * content_type, and the registration or null.
 */
export async function listAssets(
  query: { source?: "uploaded" | "generated" | "all"; kind?: MediaKind; character?: boolean; limit?: number } = {},
): Promise<{
  items: (LibraryItem & { source: "uploaded" | "generated"; model?: string | null })[];
  counts: { uploaded: number; generated: number; characters: number };
}> {
  const params = new URLSearchParams();
  if (query.source) params.set("source", query.source);
  if (query.kind) params.set("kind", query.kind);
  if (query.character !== undefined) params.set("character", String(query.character));
  if (query.limit) params.set("limit", String(query.limit));
  const suffix = params.toString();
  return sidecar("GET", `/media/library/assets${suffix ? `?${suffix}` : ""}`);
}

/** Uploading an image is the same call; the backend classifies the file. */
export function uploadLibraryImage(file: Blob, opts: { name?: string; model?: string; folderId?: string } = {}): Promise<LibraryItem> {
  return uploadLibraryMedia(file, { ...opts, name: opts.name || "image.png" });
}

export function updateLibraryImage(
  id: string,
  patch: { favourite?: boolean; name?: string; folder_id?: string | null; used?: boolean },
): Promise<LibraryItem> {
  return sidecar<LibraryItem>("PATCH", `/media/library/media/${encodeURIComponent(id)}`, patch);
}

export async function deleteLibraryImage(id: string, confirm = false): Promise<void> {
  // Without `confirm` the backend refuses (409) a file a generation was made
  // from, and says which ones, so the customer can be asked rather than told.
  await sidecar<unknown>("DELETE", `/media/library/media/${encodeURIComponent(id)}${confirm ? "?confirm=1" : ""}`);
}

export function setLibraryOrder(ids: string[]): Promise<unknown> {
  return sidecar<unknown>("PUT", "/media/library/media/order", { ids });
}

/** A URL a video provider can fetch, so image-to-video does not re-upload the bytes. */
export function libraryImageLink(id: string): Promise<{ url: string; expires_at: number }> {
  return sidecar<{ url: string; expires_at: number }>("GET", `/media/library/media/${encodeURIComponent(id)}/link`);
}

// ---- using media for a generation -------------------------------------------------

/** Which library files play which part in a request. */
/**
 * Registers an image with the video provider so it can be reused as a
 * character, or removes it again.
 *
 * Not a separate library: the registration travels on the image in
 * `listLibrary`, and these act on the image's id. What registering buys is
 * pre-authorisation - the provider intercepts reference material that looks
 * like a deepfake or an infringement, and a registered image is let through
 * where the same file sent as a plain link would be stopped.
 *
 * Deliberate rather than automatic, because it takes a slot in a quota bought
 * from the provider. An unregistered image still generates.
 */
export async function registerCharacter(
  itemId: string,
  input: { consent?: Record<string, unknown> } = {},
): Promise<CharacterState> {
  return sidecar<CharacterState>("POST", `/media/library/media/${encodeURIComponent(itemId)}/character`, {
    consent: input.consent ?? {},
  });
}

/**
 * Removes an image from the provider. The file itself is untouched.
 *
 * Immediate and not undoable at their end, which is worth saying wherever this
 * is offered. Registering again is one click; it is the preparation that has
 * to be repeated.
 */
export async function unregisterCharacter(itemId: string): Promise<void> {
  await sidecar<void>("DELETE", `/media/library/media/${encodeURIComponent(itemId)}/character`);
}

/** Whether anything about this registration is still expected to change. */
export function characterSettling(state: CharacterState | null | undefined): boolean {
  return state?.status === "pending" || state?.status === "processing";
}

export type ReferenceSelection = {
  model: string;
  first_frame?: string;
  last_frame?: string;
  reference_video?: string[];
  reference_audio?: string[];
  reference_image?: string[];
};

export type ReferenceCheck = {
  ok: true;
  model: string;
  /** The facts that price the reference: input seconds, images, audio files. */
  facts: { input_video_seconds: number; input_images: number; input_audios: number };
  /** Files the backend could not measure; the provider judges these itself. */
  unverified: string[];
  urls: Partial<Record<"first_frame" | "last_frame" | "reference_video" | "reference_audio" | "reference_image", string | string[]>>;
  /** Which of the picked files travelled as a registered character. */
  registered?: string[];
  expires_at?: number | null;
};

/**
 * Checks a selection against the model's rules, and - unless this is a dry run -
 * returns the URLs the provider will fetch.
 *
 * This is where a customer finds out that a clip is too long or in the wrong
 * codec, which is why it is worth calling twice: with `dryRun` while they are
 * still choosing, and for real just before submitting. A refusal arrives as an
 * ApiError whose message lists every problem found.
 */
export async function checkReferences(selection: ReferenceSelection, dryRun = false): Promise<ReferenceCheck> {
  return sidecar<ReferenceCheck>(
    "POST",
    `/media/library/references${dryRun ? "?dry_run=1" : ""}`,
    selection as unknown as Record<string, unknown>,
  );
}

/** What this account stores, and what that costs per month. */
export type StorageUsage = {
  bytes: number;
  gb: number;
  usd_per_gb_month: number;
  monthly_usd: number;
  charged_usd: number;
  pending_usd: number;
  owed_usd: number;
  measured_at: string | null;
  by_kind: Record<string, { count: number; bytes: number }>;
};

export function getStorageUsage(): Promise<StorageUsage> {
  return sidecar<StorageUsage>("GET", "/media/storage");
}

export function createLibraryFolder(name: string): Promise<LibraryFolder> {
  return sidecar<LibraryFolder>("POST", "/media/library/folders", { name });
}

export function renameLibraryFolder(id: string, name: string): Promise<LibraryFolder> {
  return sidecar<LibraryFolder>("PATCH", `/media/library/folders/${encodeURIComponent(id)}`, { name });
}

export async function deleteLibraryFolder(id: string): Promise<void> {
  await sidecar<unknown>("DELETE", `/media/library/folders/${encodeURIComponent(id)}`);
}

export function getProfileMedia(): Promise<{ avatar_url: string | null }> {
  return sidecar<{ avatar_url: string | null }>("GET", "/media/profile");
}

export function uploadAvatar(file: Blob, name = "avatar.png"): Promise<{ avatar_url: string }> {
  const form = new FormData();
  form.append("file", file, name);
  return sidecar<{ avatar_url: string }>("POST", "/media/profile/avatar", form);
}

export async function deleteAvatar(): Promise<void> {
  await sidecar<unknown>("DELETE", "/media/profile/avatar");
}

/** Erases every stored file for the signed-in customer. */
export function purgeMedia(): Promise<{ objects_deleted: number }> {
  return sidecar<{ objects_deleted: number }>("DELETE", "/media/account/media");
}

// ---- account -------------------------------------------------------------------

export function updateDisplayName(displayName: string): Promise<unknown> {
  return account("PUT", "/api/user/self", { display_name: displayName.slice(0, 20) });
}

/** Deletes stored media, then the hub account. Needs the current password. */
export async function deleteAccount(password: string): Promise<void> {
  const proof = await securityProof("account.delete", password);
  try {
    await purgeMedia();
  } catch {
    /* keep going: the account must still be deleted */
  }
  const res = await authedFetch("DELETE", "/api/user/self", undefined, { "X-Security-Proof": proof });
  const payload = (await parseBody(res)) as Envelope<unknown> | null;
  if (!res.ok || !payload?.success) throw errorFrom(res, payload);
  clearLocalAuth();
}

// ---- model catalog (from the backend database) ------------------------------------

/**
 * The rules a file has to satisfy to be used as a reference, and what using it
 * costs. These live in the catalogue row in the backend's database, not here:
 * the same numbers drive the backend's checks, the messages a customer sees,
 * and the estimate below the Generate button.
 */
export type ReferenceLimits = {
  max_count?: number;
  formats?: string[];
  codecs?: string[];
  max_bytes?: number;
  min_seconds?: number;
  max_seconds?: number;
  max_total_seconds?: number;
  min_px?: number;
  max_px?: number;
  min_aspect?: number;
  max_aspect?: number;
  /** Price, where the provider charges for the input: per second, or per file. */
  usd_per_second?: number;
  usd_each?: number;
  /**
   * True when an input second costs whatever an output second costs, which is
   * how MiniMax bills a reference clip. There is no single figure to show: the
   * rate depends on the resolution being generated, so the rate card decides.
   */
  billed_at_output_rate?: boolean;
  /** Files of this kind that cost nothing (MiniMax gives the first five images). */
  free_count?: number;
};

export type ReferenceRules = {
  mutually_exclusive_with_frames?: boolean;
  /** How many images or clips the model needs before it can generate at all.
   *  A reference-to-video deployment cannot work from a prompt alone. */
  min_visual?: number;
  video?: ReferenceLimits;
  audio?: ReferenceLimits;
  image?: ReferenceLimits;
  frame_image?: ReferenceLimits;
};

export type CatalogModel = {
  slug: string;
  /** The model name the hub routes, which may differ from the site's slug. */
  model: string;
  /**
   * What this model makes. It decides how the rest of the row reads:
   * `resolutions` is ["720p"] for a video and ["2048x1152"] for an image,
   * `durations` and `aspectRatios` are empty for an image, and the playground
   * shows a different set of controls for each.
   *
   * Optional because an older backend does not send it, and a model that does
   * not say is a video - which every model was before image generation.
   */
  modality?: "video" | "image";
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  durations: number[];
  resolutions: string[];
  popularResolutions: string[];
  aspectRatios: string[];
  supports: {
    image?: boolean;
    audio?: boolean;
    seed?: boolean;
    video_reference?: boolean;
    audio_reference?: boolean;
    image_reference?: boolean;
    /** What reference material this model takes, and what each file must satisfy. */
    reference?: ReferenceRules;
    /** Reusable characters registered with the provider. Absent = not offered. */
    portrait?: { max_count?: number };
    /** What sizes an image model will render, as a pixel-count envelope. */
    image_size?: { min_pixels?: number; max_pixels?: number; default?: string };
  };
  poster: string | null;
  demoVideo: string | null;
  sortOrder: number;
  /** False when no provider serves the model, so the site can say so up front. */
  available: boolean;
  pricing: {
    billing_mode?: string;
    billing_expr?: string;
    billing_usage_schema?: import("./pricing-expr").BillingUsageSchema;
    /**
     * USD per call, which is how an image is billed: one figure per image
     * rather than an expression over usage facts. Absent for a video model,
     * whose price depends on what was asked for.
     */
    model_price?: number;
  } | null;
  /**
   * True for a model that is not published yet and reaches this account only
   * because someone was let in on it (scripts/preview_access.py). Absent on
   * every model everyone can see.
   */
  preview?: boolean;
};

// ---- how a video was made --------------------------------------------------------

/**
 * The request a generation was made with, and the library files that went into
 * it. The backend reads this back out of its own behaviour log, so it is what
 * was actually sent rather than what the page thinks it sent.
 */
export type GenerationInput = {
  role: string;
  item_id: string | null;
  url: string | null;
  name: string | null;
  kind: MediaKind | null;
  /** False when the file has since been deleted. The video still plays. */
  available: boolean;
};

export type GenerationRecord = {
  task_id: string;
  requested_at: string;
  /** Verbatim, as recorded. */
  request: Record<string, unknown>;
  inputs: GenerationInput[];
  /** The same request with expired links replaced, safe to copy. */
  copyable?: Record<string, unknown>;
  curl: string;
  links_expired: boolean;
};

export function getGeneration(taskId: string): Promise<GenerationRecord> {
  return sidecar<GenerationRecord>("GET", `/media/generations/${encodeURIComponent(taskId)}`);
}

/**
 * What each recent generation was asked for, from the platform's own record.
 *
 * The hub keeps a task's request only until the job finishes - the provider's
 * view of the task replaces it, and no provider is obliged to echo the prompt -
 * so this is the only place a finished generation's prompt survives for every
 * device, and the only place at all for one submitted through the API.
 */
export function listGenerationPrompts(limit = 100): Promise<{
  generations: { task_id: string; prompt: string; model: string; kind?: "video" | "image"; requested_at: string }[];
}> {
  return sidecar("GET", `/media/generations?limit=${limit}`);
}

/** Removes a generated video and stops paying to store it. */
export function deleteVideo(taskId: string): Promise<{ deleted: boolean; already?: boolean }> {
  return sidecar<{ deleted: boolean; already?: boolean }>("DELETE", `/media/videos/${encodeURIComponent(taskId)}`);
}

// ---- getting started ------------------------------------------------------------

/**
 * What this account has already done, from the account rather than the browser.
 *
 * Each milestone is latched by the backend the first time it is seen, so a tick
 * never disappears - the balance can be spent and the key deleted and both
 * steps stay done. `complete` is the signal to stop showing the checklist.
 */
export type Onboarding = {
  steps: { key: "account" | "billing" | "balance" | "api_key"; reached: boolean; reached_at: string | null }[];
  reached: number;
  total: number;
  complete: boolean;
};

export function getOnboarding(): Promise<Onboarding> {
  return sidecar<Onboarding>("GET", "/onboarding");
}

/** Prices that are not per-model: what storage costs. Public, like the catalogue. */
export type PlatformRates = {
  currency: string;
  storage: { usd_per_gb_month: number; metered_every_seconds: number; enabled: boolean };
};

export async function getPlatformRates(): Promise<PlatformRates> {
  const res = await fetch("/catalog/rates", { credentials: "same-origin" });
  const body = (await parseBody(res)) as PlatformRates | null;
  if (!res.ok || !body) throw errorFrom(res, body);
  return body;
}

export async function getCatalog(): Promise<CatalogModel[]> {
  // Public, and it has to stay public - the pricing page and /models render
  // signed out. But signed in it can return more: an unpublished model this
  // account has been let in on comes back marked `preview`. So the session is
  // sent when there is one, and a session that turns out to be dead falls back
  // to the anonymous list rather than turning a browsable page into a login
  // wall.
  let res: Response;
  if (hasSession()) {
    try {
      res = await authedFetch("GET", "/catalog");
    } catch {
      res = await fetch("/catalog", { credentials: "same-origin" });
    }
  } else {
    res = await fetch("/catalog", { credentials: "same-origin" });
  }
  const body = (await parseBody(res)) as { models?: CatalogModel[] } | null;
  if (!res.ok || !body) throw errorFrom(res, body);
  return body.models ?? [];
}
