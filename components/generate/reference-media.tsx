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

import { useEffect, useRef, useState } from "react";
import {
  characterSettling,
  listLibrary,
  registerCharacter,
  unregisterCharacter,
  uploadLibraryMedia,
  type CharacterState,
  type LibraryItem,
  type ReferenceLimits,
} from "@/lib/hub";
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
export function LibraryImagePicker({ chosen, onPick }: { chosen: string[]; onPick: (item: LibraryItem) => void }) {
  const [items, setItems] = useState<LibraryItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    listLibrary("image")
      .then((listing) => {
        if (alive) setItems(listing.items);
      })
      .catch((err) => {
        if (alive) setItems([]);
        toast(err instanceof Error ? err.message : "Could not load your images.");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (items === null) return <p className="mb-2 text-sm text-muted">Loading your images…</p>;
  if (items.length === 0) {
    return (
      <p className="mb-2 text-sm text-muted">
        No images in your library yet. Anything you upload here is kept, so it is one click next time.
      </p>
    );
  }
  const taken = new Set(chosen);
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
              <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
              {on && (
                <span className="absolute inset-x-0 bottom-0 bg-accent/90 py-0.5 text-center font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] text-ink">
                  chosen
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Registering a picked image with the provider, so it can be reused as a
 * character and, more to the point, so a likeness gets through their review.
 *
 * This lives on the image rather than in a library of its own, because that is
 * what it is: the same file, with a note saying the provider has been told
 * about it. Three things it has to be honest about, all of them visible to a
 * customer and none of them ours to hide:
 *
 *   it takes time      Preparation is asynchronous with no promised
 *                      turnaround, so a freshly registered image says so
 *                      instead of looking broken.
 *   it can be refused  Their review has the final say, and showing their
 *                      reason is the difference between a customer fixing the
 *                      photo and retrying the same one.
 *   removing is final  It reaches the provider immediately and cannot be
 *                      undone. The file stays, so doing it again is one click.
 */
function CharacterControl({
  item,
  onChange,
  disabled,
}: {
  item: LibraryItem;
  onChange: (next: CharacterState | null) => void;
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [kind, setKind] = useState<"virtual" | "person">("virtual");
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const state = item.character;

  // Look again while preparation is still running, and stop when it is not.
  useEffect(() => {
    if (!characterSettling(state)) return;
    const timer = setInterval(async () => {
      try {
        const listing = await listLibrary("image");
        const fresh = listing.items.find((i) => i.id === item.id);
        if (fresh && fresh.character?.status !== state?.status) onChange(fresh.character ?? null);
      } catch {
        // A failed poll is not worth a message: the next one will do.
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [state, item.id, onChange]);

  async function register() {
    if (kind === "person" && !consented) {
      toast("Confirm you have the right to use this person's likeness first.");
      return;
    }
    setBusy(true);
    try {
      onChange(
        await registerCharacter(item.id, {
          kind,
          consent: {
            has_permission: true,
            asserted: kind === "person" ? "the subject has agreed to this use" : "not a real person",
            at: new Date().toISOString(),
          },
        }),
      );
      setAsking(false);
      setConsented(false);
      toast("Preparing this character — usually a few minutes.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not register that image.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Stop using "${item.name}" as a character?\n\n` +
        "This removes it from the video provider immediately and cannot be undone. " +
        "The image stays in your library, so you can register it again — it just has to be prepared from scratch.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await unregisterCharacter(item.id);
      onChange(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not remove that character.");
    } finally {
      setBusy(false);
    }
  }

  if (state && state.status === "ready") {
    return (
      <div className="flex items-center gap-2">
        <span className="border border-accent/60 bg-accent/10 px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.04em] text-accent-ink">
          character
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={busy || disabled}
          className="text-[11px] text-dim underline hover:text-danger"
        >
          stop
        </button>
      </div>
    );
  }

  if (state && characterSettling(state)) {
    return <span className="text-[11px] text-blue">Preparing as a character — usually a few minutes.</span>;
  }

  if (state && state.status === "failed") {
    return (
      <div className="min-w-0">
        <p className="text-[11px] leading-snug text-danger">
          {state.error?.message || "The provider would not accept this image as a character."}
        </p>
        <button
          type="button"
          onClick={() => setAsking(true)}
          disabled={busy || disabled}
          className="text-[11px] text-dim underline hover:text-fg"
        >
          try again
        </button>
      </div>
    );
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={busy || disabled}
        title="Register this image with the provider so it can be reused, and so a likeness passes their review"
        className="text-[11px] text-dim underline hover:text-fg"
      >
        use as a character
      </button>
    );
  }

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-dim">This is</span>
        {(["virtual", "person"] as const).map((option) => (
          <label key={option} className="flex items-center gap-1">
            <input
              type="radio"
              name={`character-kind-${item.id}`}
              checked={kind === option}
              onChange={() => {
                setKind(option);
                setConsented(false);
              }}
            />
            <span>{option === "virtual" ? "invented" : "a real person"}</span>
          </label>
        ))}
      </div>
      {kind === "person" && (
        <label className="flex items-start gap-1.5 text-[11px] leading-snug text-muted">
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} className="mt-0.5" />
          <span>
            They have agreed to appear in videos I generate and I can show that if asked. We keep a
            record of this.
          </span>
        </label>
      )}
      <div className="flex gap-2 text-[11px]">
        <button type="button" onClick={register} disabled={busy} className="text-accent-ink underline">
          {busy ? "registering…" : "register"}
        </button>
        <button type="button" onClick={() => setAsking(false)} disabled={busy} className="text-dim underline">
          cancel
        </button>
      </div>
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
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const full = Boolean(limits?.max_count && items.length >= limits.max_count);

  useEffect(() => {
    if (!browsing || stored) return;
    let alive = true;
    listLibrary(kind)
      .then((listing) => {
        if (alive) setStored(listing.items);
      })
      .catch((err) => {
        if (alive) setStored([]);
        toast(err instanceof Error ? err.message : `Could not load your ${kind} files.`);
      });
    return () => {
      alive = false;
    };
  }, [browsing, stored, kind]);

  async function add(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    const added: LibraryItem[] = [];
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
                <video src={item.url} muted playsInline controls className="h-20 w-32 bg-black object-contain" />
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
                <p className="text-xs text-muted">{describe(item)}</p>
                {offersCharacters && (
                  <div className="mt-1">
                    <CharacterControl
                      item={item}
                      disabled={disabled}
                      onChange={(next) =>
                        onChange(items.map((i) => (i.id === item.id ? { ...i, character: next } : i)))
                      }
                    />
                  </div>
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
              {stored.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{item.name}</p>
                    <p className="text-xs text-muted">{describe(item)}</p>
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
        </div>
      )}
    </div>
  );
}
