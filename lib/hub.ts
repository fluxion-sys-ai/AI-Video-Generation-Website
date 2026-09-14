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
    if (message) return new ApiError(cleanMessage(message), res.status, code);
  }
  if (res.status === 429) return new ApiError("Too many requests. Try again in a minute.", 429);
  return new ApiError(`Request failed (${res.status}).`, res.status);
}

let refreshing: Promise<Session | null> | null = null;

/** Trades the refresh cookie for a new access token. Concurrent callers share one request. */
async function refreshSession(): Promise<Session | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch("/api/user/auth/refresh", { method: "POST", credentials: "same-origin" });
        const body = (await parseBody(res)) as Envelope<AuthData> | null;
        if (!res.ok || !body?.success || !body.data?.access_token) return null;
        return storeSession(body.data);
      } catch {
        return null;
      }
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
    const detail = payload && typeof payload === "object" ? (payload as { detail?: string }).detail : undefined;
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

// ---- developer API keys (Profile -> API keys) --------------------------------

export type ApiKeyRow = {
  id: number;
  name: string;
  /** The hub's own masked form, e.g. "gdSL**********kRXS". */
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
    masked: row.key ?? "",
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

/** Creates a key that spends the account balance, with no expiry, and returns its secret. */
export async function createApiKey(name: string): Promise<{ row: ApiKeyRow; secret: string }> {
  const clean = name.trim() || "default";
  if (clean === WEB_KEY_NAME) throw new ApiError(`"${WEB_KEY_NAME}" is reserved for this website.`, 400);
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

  let video: Video;
  if (req.image) {
    const form = new FormData();
    for (const [name, value] of Object.entries(fields)) form.append(name, String(value));
    form.append("image", req.image, req.imageName || "reference.png");
    video = await relay<Video>("POST", "/v1/videos", { form });
  } else {
    video = await relay<Video>("POST", "/v1/videos", { json: fields });
  }
  rememberPrompt(video.id, req.prompt);
  return video;
}

export function getVideo(id: string): Promise<Video> {
  return relay<Video>("GET", `/v1/videos/${encodeURIComponent(id)}`);
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
export async function waitForVideo(
  id: string,
  opts: { signal?: AbortSignal; onUpdate?: (video: Video) => void; intervalMs?: number } = {},
): Promise<Video> {
  let errors = 0;
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
    await sleep(opts.intervalMs ?? 3000, opts.signal);
  }
}

/**
 * Playable URL for a finished video. It carries a signed `access` capability,
 * so it works in <video src> and downloads without an Authorization header.
 */
export async function videoUrl(taskId: string): Promise<string> {
  try {
    const stored = await sidecar<{ url: string; source: "gcs" | "hub" }>("GET", `/media/videos/${encodeURIComponent(taskId)}`);
    if (stored?.url) return stored.url;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) throw err;
    /* sidecar unavailable: fall through to the hub's own signed URL */
  }
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

// ---- customer media: reference images, folders, profile photo ---------------------
// Stored in the backend's bucket so they follow the customer across devices.

export type LibraryImage = {
  id: string;
  name: string;
  content_type: string;
  bytes: number;
  model: string | null;
  folder_id: string | null;
  favourite: boolean;
  uses: number;
  created_at: string;
  /** Short-lived URL for display. */
  url: string;
};

export type LibraryFolder = { id: string; name: string; created_at: string };

export type LibraryListing = {
  items: LibraryImage[];
  folders: LibraryFolder[];
  limits: { max_images: number; max_bytes_per_image: number };
};

export function listLibrary(): Promise<LibraryListing> {
  return sidecar<LibraryListing>("GET", "/media/library/images");
}

export function uploadLibraryImage(file: Blob, opts: { name?: string; model?: string; folderId?: string } = {}): Promise<LibraryImage> {
  const form = new FormData();
  form.append("file", file, opts.name || "image.png");
  if (opts.model) form.append("model", opts.model);
  if (opts.folderId) form.append("folder_id", opts.folderId);
  return sidecar<LibraryImage>("POST", "/media/library/images", form);
}

export function updateLibraryImage(
  id: string,
  patch: { favourite?: boolean; name?: string; folder_id?: string | null; used?: boolean },
): Promise<LibraryImage> {
  return sidecar<LibraryImage>("PATCH", `/media/library/images/${encodeURIComponent(id)}`, patch);
}

export async function deleteLibraryImage(id: string): Promise<void> {
  await sidecar<unknown>("DELETE", `/media/library/images/${encodeURIComponent(id)}`);
}

export function setLibraryOrder(ids: string[]): Promise<unknown> {
  return sidecar<unknown>("PUT", "/media/library/images/order", { ids });
}

/** A URL a video provider can fetch, so image-to-video does not re-upload the bytes. */
export function libraryImageLink(id: string): Promise<{ url: string; expires_at: number }> {
  return sidecar<{ url: string; expires_at: number }>("GET", `/media/library/images/${encodeURIComponent(id)}/link`);
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

export type CatalogModel = {
  slug: string;
  /** The model name the hub routes, which may differ from the site's slug. */
  model: string;
  name: string;
  tagline: string;
  description: string;
  capabilities: string[];
  durations: number[];
  resolutions: string[];
  popularResolutions: string[];
  aspectRatios: string[];
  supports: { image?: boolean; audio?: boolean; seed?: boolean };
  poster: string | null;
  demoVideo: string | null;
  sortOrder: number;
  /** False when no provider serves the model, so the site can say so up front. */
  available: boolean;
  pricing: {
    billing_mode?: string;
    billing_expr?: string;
    billing_usage_schema?: import("./pricing-expr").BillingUsageSchema;
  } | null;
};

export async function getCatalog(): Promise<CatalogModel[]> {
  const res = await fetch("/catalog", { credentials: "same-origin" });
  const body = (await parseBody(res)) as { models?: CatalogModel[] } | null;
  if (!res.ok || !body) throw errorFrom(res, body);
  return body.models ?? [];
}
