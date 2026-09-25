"use client";

// Choosing reference material for a generation: the clips, sound and stills a
// model should follow, as opposed to a single image it starts from.
//
// Every rule and price shown here comes from the model's catalogue row in the
// backend (model.reference), so this component states the limits without
// knowing them: how many files, which containers, how long, and what the
// provider charges for the input. Uploading is permissive - the backend accepts
// any video or audio - and the verdict on a particular file arrives from the
// backend's own check, which the page runs whenever the selection changes.

import { useCallback, useEffect, useRef, useState } from "react";
import { listLibrary, uploadLibraryMedia, type LibraryItem, type ReferenceLimits } from "@/lib/hub";
import { useNearViewport } from "@/components/library/lazy-result";
import { refreshLibrary } from "@/lib/prefs";
import { money } from "@/lib/rate-card";
import { toast } from "@/lib/toast";

type Kind = "video" | "audio" | "image";

// What a provider takes for an image input. HEIC is here because that is what
// phones produce; the backend accepts it and so does MiniMax.
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif,image/*";

const box =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue";

/** "MP4 or MOV, 2-15s each, up to 3, $0.08 per second of input" */
export function limitSummary(limits: ReferenceLimits | undefined, kind: Kind): string {
  if (!limits) return "";
  const parts: string[] = [];
  const formats = (limits.formats || []).map((f) => f.toUpperCase());
  if (formats.length) parts.push(formats.length > 1 ? `${formats.slice(0, -1).join(", ")} or ${formats.at(-1)}` : formats[0]);
  if (limits.min_seconds != null && limits.max_seconds != null) parts.push(`${limits.min_seconds}-${limits.max_seconds}s each`);
  else if (limits.max_seconds != null) parts.push(`up to ${limits.max_seconds}s`);
  if (limits.max_total_seconds != null) parts.push(`${limits.max_total_seconds}s in total`);
  if (limits.max_count) parts.push(`up to ${limits.max_count} file${limits.max_count === 1 ? "" : "s"}`);
  if (limits.max_bytes) parts.push(`${Math.round(limits.max_bytes / 1048576)} MB each`);
  if (limits.billed_at_output_rate) parts.push("charged per second at the output's own rate");
  else if (limits.usd_per_second) parts.push(`${money(limits.usd_per_second)} per second of input`);
  else if (limits.usd_each) parts.push(`${money(limits.usd_each)} each${limits.free_count ? `, first ${limits.free_count} free` : ""}`);
  else parts.push(kind === "audio" ? "free" : "no input charge");
  if (kind === "image" && limits.min_px && limits.max_px) parts.push(`${limits.min_px}-${limits.max_px}px`);
  return parts.join(" · ");
}

function describe(item: LibraryItem): string {
  const bits: string[] = [];
  if (item.duration_seconds != null) bits.push(`${Number(item.duration_seconds.toFixed(2))}s`);
  if (item.width && item.height) bits.push(`${item.width}x${item.height}`);
  if (item.codec) bits.push(item.codec.toUpperCase());
  bits.push(`${(item.bytes / 1048576).toFixed(1)} MB`);
  if (item.duration_seconds == null) bits.push("length unknown");
  return bits.join(" · ");
}

/**
 * The images already in the customer's library, to choose one from.
 *
 * A reference still is usually one they have used before, so the playground
 * should not make them find the file again. Picking one hands over the URL the
 * library already serves it from; the generation then sends that link rather
 * than re-uploading the bytes.
 */
/**
 * The grid of stored images.
 *
 * A registered one is badged here, not only once it has been picked: choosing
 * between "the face I set up" and "some other photo of the same person" is the
 * choice being made at this moment, and a label that only appears afterwards
 * is a label that arrives too late to help.
 */
// A page, not a library. Every row the backend returns costs it a signed link,
// and every tile rendered costs the browser a full-size download, so asking for
// three hundred images to show a dozen was paying twice for what nobody sees.
// More arrive when the reader scrolls to the end of what they have.
const PICKER_PAGE = 24;

function LazyTile({ url, name, className }: { url: string; name: string; className: string }) {
  const box = useRef<HTMLSpanElement | null>(null);
  const near = useNearViewport(box);
  return (
    <span ref={box} className="block h-full w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={near ? url : undefined} alt={name} loading="lazy" decoding="async" className={className} />
    </span>
  );
}

export function LibraryImagePicker({ chosen, onPick }: { chosen: string[]; onPick: (item: LibraryItem) => void }) {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(async (offset: number) => {
    setLoading(true);
    try {
      const listing = await listLibrary("image", { limit: PICKER_PAGE, offset });
      setItems((have) => (offset === 0 ? listing.items : [...(have || []), ...listing.items]));
      setTotal(listing.total ?? listing.items.length);
    } catch (err) {
      setItems((have) => have || []);
      toast(err instanceof Error ? err.message : "Could not load your images.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0);
  }, [loadPage]);

  if (items === null) return <p className="mb-2 text-sm text-muted">Loading your images…</p>;
  if (items.length === 0) {
    return (
      <p className="mb-2 text-sm text-muted">
        No images in your library yet. Anything you upload here is kept, so it is one click next time.
      </p>
    );
  }
  const taken = new Set(chosen);
  const more = items.length < total;
  return (
    <div className="mb-2 max-h-48 overflow-y-auto border border-line bg-surface/60 p-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {items.map((item) => {
          const on = taken.has(item.url);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item)}
              disabled={on}
              title={`${item.name}${item.width && item.height ? ` · ${item.width}x${item.height}` : ""}`}
              className={`relative aspect-square overflow-hidden border bg-black transition-colors ${
                on ? "border-accent opacity-60" : "border-line hover:border-blue"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <LazyTile url={item.url} name={item.name} className="h-full w-full object-cover" />
              {item.character && (
                <span
                  title={
                    item.character.status === "ready"
                      ? "Registered with the provider as a character"
                      : item.character.status === "failed"
                        ? item.character.error?.message || "The provider would not accept this as a character"
                        : "Being prepared as a character"
                  }
                  className={`absolute left-0 top-0 px-1 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] ${
                    item.character.status === "ready"
                      ? "bg-accent/90 text-ink"
                      : item.character.status === "failed"
                        ? "bg-danger/90 text-ink"
                        : "bg-blue/90 text-ink"
                  }`}
                >
                  {item.character.status === "ready"
                    ? "character"
                    : item.character.status === "failed"
                      ? "refused"
                      : "preparing"}
                </span>
              )}
              {on && (
                <span className="absolute inset-x-0 bottom-0 bg-accent/90 py-0.5 text-center font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] text-ink">
                  chosen
                </span>
              )}
            </button>
          );
        })}
      </div>
      {more && (
        <button
          type="button"
          onClick={() => void loadPage(items.length)}
          disabled={loading}
          className="mt-2 w-full border border-line py-1 text-xs text-muted hover:border-blue hover:text-fg-soft disabled:opacity-60"
        >
          {loading ? "Loading…" : `Show more (${items.length} of ${total})`}
        </button>
      )}
    </div>
  );
}

export function ReferenceMedia({
  kind,
  limits,
  modelSlug,
  items,
  onChange,
  disabled,
  disabledReason,
  offersCharacters,
}: {
  kind: Kind;
  limits: ReferenceLimits | undefined;
  modelSlug: string;
  items: LibraryItem[];
  onChange: (items: LibraryItem[]) => void;
  disabled?: boolean;
  disabledReason?: string;
  /** Whether this model lets an image be registered as a reusable character. */
  offersCharacters?: boolean;
}) {
  const [browsing, setBrowsing] = useState(false);
  const [stored, setStored] = useState<LibraryItem[] | null>(null);
  const [storedTotal, setStoredTotal] = useState(0);
  const [paging, setPaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const full = Boolean(limits?.max_count && items.length >= limits.max_count);

  const loadStored = useCallback(
    async (offset: number) => {
      setPaging(true);
      try {
        const listing = await listLibrary(kind, { limit: PICKER_PAGE, offset });
        setStored((have) => (offset === 0 ? listing.items : [...(have || []), ...listing.items]));
        setStoredTotal(listing.total ?? listing.items.length);
      } catch (err) {
        setStored((have) => have || []);
        toast(err instanceof Error ? err.message : `Could not load your ${kind} files.`);
      } finally {
        setPaging(false);
      }
    },
    [kind],
  );

  useEffect(() => {
    if (!browsing || stored) return;
    let alive = true;
    void loadStored(0).then(() => {
      if (!alive) return;
    });
    return () => {
      alive = false;
    };
  }, [browsing, stored, kind]);

  async function add(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    const added: LibraryItem[] = [];
    // Plain reference material. A character is made in the library, where the
    // decision belongs: registering costs a slot of a purchased allowance and
    // is not something to walk into while assembling one generation.
    for (const file of files) {
      try {
        added.push(await uploadLibraryMedia(file, { name: file.name, model: modelSlug }));
      } catch (err) {
        toast(err instanceof Error ? err.message : `Could not upload ${file.name}.`);
      }
    }
    setBusy(false);
    if (!added.length) return;
    // A new upload belongs in the browser list and the library page too.
    setStored((prev) => (prev ? [...added, ...prev] : prev));
    void refreshLibrary().catch(() => {});
    const room = limits?.max_count ? Math.max(0, limits.max_count - items.length) : added.length;
    onChange([...items, ...added.slice(0, room)]);
  }

  const chosenIds = new Set(items.map((i) => i.id));
  // Ready portraits first on a model that takes them: they are the reason
  // somebody opened this list, and hunting for one among a hundred screenshots
  // is the thing the tag alone does not fix. Everything else keeps its order.
  const browseOrder =
    offersCharacters && stored
      ? [...stored].sort(
          (a, b) =>
            Number(b.character?.status === "ready") - Number(a.character?.status === "ready"),
        )
      : stored || [];
  const label = kind === "video" ? "Reference video" : kind === "audio" ? "Reference audio" : "Reference images";

  return (
    <div data-reference={kind}>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.06em] text-fg-soft">
          {label}
        </label>
        <span className="text-xs text-dim">{disabled ? disabledReason : limitSummary(limits, kind)}</span>
      </div>

      {items.length > 0 && (
        <ul className="mb-2 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 border border-line bg-surface/60 p-2">
              {kind === "video" ? (
                <video
                  src={item.url}
                  muted
                  playsInline
                  controls
                  // A reference clip can be 200 MB. Enough to show a frame,
                  // and not a byte more until somebody asks to watch it.
                  preload="metadata"
                  className="h-20 w-32 bg-black object-contain"
                />
              ) : kind === "audio" ? (
                <audio src={item.url} controls className="h-10 w-56" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.name} className="h-20 w-32 bg-black object-contain" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">
                  {offersCharacters && (
                    <span className="mr-1.5 font-[family-name:var(--font-jetbrains)] text-[10px] text-dim">
                      Image {items.indexOf(item) + 1}
                    </span>
                  )}
                  {item.name}
                </p>
                <p className="truncate text-xs text-muted" title={describe(item)}>{describe(item)}</p>
                {offersCharacters && item.character?.status === "ready" && (
                  <p className="mt-0.5 text-[11px] text-accent-ink">
                    Registered character — refer to it as &ldquo;Image {items.indexOf(item) + 1}&rdquo; in your prompt.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                className="shrink-0 border border-line-strong px-2 py-1 text-xs text-fg-soft hover:border-danger hover:text-danger"
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || full || busy}
          onClick={() => fileInput.current?.click()}
          className={`${box} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? "Uploading…" : kind === "image" ? "Upload images" : `Upload ${kind}`}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={kind === "video" ? "video/*" : kind === "audio" ? "audio/*" : IMAGE_ACCEPT}
          multiple={(limits?.max_count || 1) > 1}
          className="hidden"
          onChange={(e) => {
            void add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={disabled || full}
          onClick={() => setBrowsing((open) => !open)}
          className={`${box} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {browsing ? "Close library" : "From library"}
        </button>
        {full && <span className="text-xs text-dim">that is the most this model takes</span>}
      </div>

      {browsing && !disabled && (
        <div className="mt-2 max-h-56 overflow-y-auto border border-line bg-surface/60">
          {stored === null ? (
            <p className="p-3 text-sm text-muted">Loading…</p>
          ) : stored.length === 0 ? (
            <p className="p-3 text-sm text-muted">Nothing here yet. Upload a {kind} file and it stays in your library.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {browseOrder.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-2">
                  {/* A face cannot be recognised from a filename, and a
                      portrait is picked by which face it is. */}
                  {kind === "image" && item.url && (
                    <LazyTile
                      url={item.url}
                      name=""
                      className="h-10 w-10 shrink-0 border border-line bg-black object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm text-fg">
                      {item.character && (
                        <span
                          title={
                            item.character.status === "ready"
                              ? "A portrait — registered with the provider"
                              : item.character.status === "failed"
                                ? item.character.error?.message ||
                                  "The provider would not accept this as a portrait"
                                : "Being prepared as a portrait — not usable yet"
                          }
                          className={`shrink-0 px-1 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] ${
                            item.character.status === "ready"
                              ? "bg-accent/90 text-ink"
                              : item.character.status === "failed"
                                ? "bg-danger/90 text-ink"
                                : "bg-blue/90 text-ink"
                          }`}
                        >
                          {item.character.status === "ready"
                            ? "portrait"
                            : item.character.status === "failed"
                              ? "refused"
                              : "preparing"}
                        </span>
                      )}
                      <span className="truncate">{item.name}</span>
                    </p>
                    <p className="truncate text-xs text-muted" title={describe(item)}>{describe(item)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={chosenIds.has(item.id) || full}
                    onClick={() => onChange([...items, item])}
                    className="shrink-0 border border-line-strong px-2 py-1 text-xs text-fg-soft hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {chosenIds.has(item.id) ? "Chosen" : "Use"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {stored !== null && stored.length > 0 && stored.length < storedTotal && (
            <button
              type="button"
              onClick={() => void loadStored(stored.length)}
              disabled={paging}
              className="w-full border-t border-hairline py-1.5 text-xs text-muted hover:text-fg-soft disabled:opacity-60"
            >
              {paging ? "Loading…" : `Show more (${stored.length} of ${storedTotal})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
