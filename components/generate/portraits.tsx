/**
 * Choosing and making portraits, in the playground.
 *
 * A portrait is a character you keep: registered once with the provider from an
 * image already in your library, then named in as many generations as you like.
 * That is why this is not the reference-image picker with a different label.
 *
 * Three things this has to be honest about, because all three are visible to a
 * customer and none of them are ours to hide:
 *
 *   it takes time     Registering is asynchronous with no promised turnaround.
 *                     A new portrait is unusable for a few minutes, so it shows
 *                     as preparing rather than appearing broken.
 *   it can be refused The provider reviews every image. A refusal comes with
 *                     their reason, and showing it is the difference between a
 *                     customer fixing the photo and retrying the same one.
 *   deleting is final Removal reaches the provider immediately and cannot be
 *                     undone, which the confirmation says in those words.
 *
 * Position matters too. The prompt refers to attachments by number - "the woman
 * in Image 1" - so each chosen portrait shows the number it will occupy, and
 * portraits are always placed before plain reference images so that number does
 * not move when the rest of the selection changes.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPortrait,
  deletePortrait,
  listPortraits,
  portraitSettling,
  type LibraryItem,
  type Portrait,
} from "@/lib/hub";
import { toast } from "@/lib/toast";
import { LibraryImagePicker } from "@/components/generate/reference-media";

/** How often to look again while anything is still being prepared. */
const POLL_MS = 8000;

function StatusPill({ portrait }: { portrait: Portrait }) {
  if (portrait.status === "ready") return null;
  const preparing = portraitSettling(portrait);
  return (
    <span
      className={`absolute inset-x-0 bottom-0 py-0.5 text-center font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] ${
        preparing ? "bg-blue/90 text-ink" : "bg-danger/90 text-ink"
      }`}
    >
      {preparing ? "preparing" : "refused"}
    </span>
  );
}

export function Portraits({
  chosen,
  onChange,
  max,
  disabled,
  disabledReason,
}: {
  chosen: Portrait[];
  onChange: (next: Portrait[]) => void;
  max: number;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [portraits, setPortraits] = useState<Portrait[] | null>(null);
  const [making, setMaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"virtual" | "person">("virtual");
  const [consented, setConsented] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const listing = await listPortraits();
      if (!alive.current) return;
      setPortraits(listing);
      // A chosen portrait that has since failed or been removed must not stay
      // selected: it would be refused at submit, after the customer has written
      // a prompt about it.
      const byId = new Map(listing.map((p) => [p.id, p]));
      const still = chosen.map((p) => byId.get(p.id)).filter((p): p is Portrait => Boolean(p));
      const usable = still.filter((p) => p.status === "ready");
      if (usable.length !== chosen.length || still.some((p, i) => p !== chosen[i])) {
        onChange(usable);
      }
    } catch (err) {
      if (alive.current) setPortraits([]);
      toast(err instanceof Error ? err.message : "Could not load your portraits.");
    }
    // `chosen` and `onChange` are deliberately not dependencies: this reads them
    // to reconcile, and listing them would re-create the poller on every pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  // Poll only while something is actually settling, and stop when it is not.
  const settling = (portraits || []).some(portraitSettling);
  useEffect(() => {
    if (!settling) return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [settling, load]);

  async function make(item: LibraryItem) {
    if (kind === "person" && !consented) {
      toast("Confirm you have the right to use this person's likeness first.");
      return;
    }
    setBusy(true);
    try {
      const made = await createPortrait({
        media_id: item.id,
        name: item.name,
        kind,
        consent:
          kind === "person"
            ? { has_permission: true, asserted: "the subject has agreed to this use", at: new Date().toISOString() }
            : { has_permission: true, asserted: "not a real person", at: new Date().toISOString() },
      });
      setPortraits((prev) => [made, ...(prev || [])]);
      setMaking(false);
      setConsented(false);
      toast(`${made.name} is being prepared — usually a few minutes.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create that portrait.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(portrait: Portrait) {
    const ok = window.confirm(
      `Delete "${portrait.name}"?\n\nThis removes it from the video provider immediately and cannot be undone. ` +
        `The original image stays in your library, so you can register it again — but it would have to be prepared from scratch.`,
    );
    if (!ok) return;
    try {
      await deletePortrait(portrait.id);
      setPortraits((prev) => (prev || []).filter((p) => p.id !== portrait.id));
      onChange(chosen.filter((p) => p.id !== portrait.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete that portrait.");
    }
  }

  function toggle(portrait: Portrait) {
    if (portrait.status !== "ready") return;
    const already = chosen.some((p) => p.id === portrait.id);
    if (already) {
      onChange(chosen.filter((p) => p.id !== portrait.id));
      return;
    }
    if (chosen.length >= max) {
      toast(`This model takes at most ${max} portrait${max === 1 ? "" : "s"} at a time.`);
      return;
    }
    onChange([...chosen, portrait]);
  }

  const takenIds = new Set(chosen.map((p) => p.id));

  return (
    <div data-reference="portrait">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-dim">
          Portraits
        </h3>
        <span className="text-xs text-dim">
          {disabled ? disabledReason : "reusable characters · registered with the provider"}
        </span>
      </div>

      {portraits === null && <p className="mb-2 text-sm text-muted">Loading your portraits…</p>}

      {portraits !== null && portraits.length === 0 && !making && (
        <p className="mb-2 text-sm text-muted">
          No portraits yet. Register a character once and you can put them in any number of videos —
          referring to them in the prompt by the number shown here.
        </p>
      )}

      {portraits !== null && portraits.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {portraits.map((portrait) => {
            const on = takenIds.has(portrait.id);
            const position = chosen.findIndex((p) => p.id === portrait.id);
            const usable = portrait.status === "ready";
            return (
              <div key={portrait.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(portrait)}
                  disabled={disabled || !usable}
                  title={
                    portrait.status === "failed"
                      ? portrait.error?.message || "The provider refused this image."
                      : portrait.status !== "ready"
                        ? "Being prepared — usually a few minutes."
                        : portrait.name
                  }
                  className={`relative block aspect-square w-full overflow-hidden border bg-black transition-colors ${
                    on ? "border-accent" : usable ? "border-line hover:border-blue" : "border-line opacity-60"
                  }`}
                >
                  {portrait.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={portrait.url} alt={portrait.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-dim">?</span>
                  )}
                  {on && (
                    <span className="absolute left-0 top-0 bg-accent px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10px] text-ink">
                      Image {position + 1}
                    </span>
                  )}
                  <StatusPill portrait={portrait} />
                </button>
                <div className="mt-1 flex items-start justify-between gap-1">
                  <span className="truncate text-[11px] text-dim" title={portrait.name}>
                    {portrait.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(portrait)}
                    className="shrink-0 text-[11px] text-dim hover:text-danger"
                    title="Delete this portrait"
                  >
                    ×
                  </button>
                </div>
                {portrait.status === "failed" && portrait.error?.message && (
                  <p className="mt-0.5 text-[11px] leading-snug text-danger">{portrait.error.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {making && (
        <div className="mb-2 border border-line bg-surface/60 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-dim">This character is</span>
            {(["virtual", "person"] as const).map((option) => (
              <label key={option} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="portrait-kind"
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
            <label className="mb-2 flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-1"
              />
              <span>
                This person has agreed to appear in videos I generate, and I can show that if asked. We
                keep a record of this with the portrait.
              </span>
            </label>
          )}
          <p className="mb-2 text-xs text-dim">
            Pick an image you have already uploaded. A clear, front-facing photo works best — a full-body
            shot and a head-and-shoulders close-up of the same character give the most consistent results.
          </p>
          <LibraryImagePicker chosen={[]} onPick={make} />
          <button
            type="button"
            onClick={() => {
              setMaking(false);
              setConsented(false);
            }}
            disabled={busy}
            className="text-xs text-dim underline hover:text-fg"
          >
            cancel
          </button>
        </div>
      )}

      {!making && !disabled && (
        <button
          type="button"
          onClick={() => setMaking(true)}
          className="border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-blue hover:text-fg"
        >
          Register a portrait
        </button>
      )}

      {chosen.length > 0 && (
        <p className="mt-2 text-xs text-dim">
          In your prompt, refer to {chosen.map((p, i) => `${p.name} as "Image ${i + 1}"`).join(", ")}.
        </p>
      )}
    </div>
  );
}
