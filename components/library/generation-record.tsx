"use client";

// One generated video, and everything the platform knows about how it was made.
//
// This is what a history entry should open: the clip itself, the exact request
// that produced it, the files from your library that went into it (each a link
// back to the source, or a note that it is gone), and the two things you
// actually want next - make it again, or stop paying to keep it.
//
// The request comes from the backend's own record of what was sent, not from
// what this page believes it sent, so it is worth copying.

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteVideo, getGeneration, type GenerationRecord } from "@/lib/hub";
import { useRouter } from "next/navigation";
import { setPendingRequest } from "@/lib/prefs";
import { formatWhen, type Generation } from "@/lib/generations";
import { CopyButton } from "@/components/docs/copy-button";
import { toast } from "@/lib/toast";

const button =
  "rounded-none border border-hairline-strong px-4 py-2 text-sm text-fg transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40";

export function GenerationRecordPanel({
  generation,
  onClose,
  onDeleted,
}: {
  generation: Generation;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [record, setRecord] = useState<GenerationRecord | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<"regenerate" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  // No resetting of state here: the panel is keyed by the video's id where it
  // is rendered, so opening a different one mounts a fresh panel and the effect
  // only writes when an answer arrives.
  useEffect(() => {
    let alive = true;
    getGeneration(generation.id)
      .then((r) => alive && setRecord(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [generation.id]);

  const missing = (record?.inputs || []).filter((i) => !i.available);
  const pretty = record ? JSON.stringify(record.copyable ?? record.request, null, 2) : "";

  /**
   * Hand the whole request to the playground: same prompt, same settings, the
   * same files re-selected. Nothing is spent by arriving there, so an edit is
   * possible first - and a file that has since been deleted is named rather
   * than silently dropped.
   */
  function reopen() {
    if (!record) return;
    setBusy("regenerate");
    setPendingRequest({ request: record.request, inputs: record.inputs, taskId: generation.id });
    router.push(`/generate?model=${generation.slug}`);
  }

  async function remove() {
    setBusy("delete");
    try {
      await deleteVideo(generation.id);
      onDeleted(generation.id);
      toast("Video deleted. It no longer costs storage.");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete that video.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[14px] border border-line bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">
              Generated video
            </h3>
            <p className="mt-1 truncate text-lg text-fg-strong" title={generation.prompt}>{generation.prompt}</p>
            <p className="text-xs text-dim">{formatWhen(generation.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-muted hover:text-fg">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        {generation.videoUrl && (
          <video src={generation.videoUrl} controls playsInline className="mt-4 aspect-video w-full bg-black object-contain" />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {/* One action, not two: making it again and opening it in the
              playground were the same wish, and going through the playground
              means an edit is possible before spending anything. */}
          <button
            type="button"
            className={button}
            disabled={busy !== null || !record}
            onClick={reopen}
            title={failed ? "There is no recorded request for this one to reopen." : undefined}
          >
            {busy === "regenerate" ? "Opening…" : "Edit and generate again"}
          </button>
          <a className={button} href={generation.videoUrl} download={`${generation.id}.mp4`}>Download</a>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy !== null}
            className="rounded-none border border-[rgba(255,107,107,0.4)] px-4 py-2 text-sm text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)] disabled:opacity-40"
          >
            Delete
          </button>
        </div>

        {/* What it was made from */}
        {record && record.inputs.length > 0 && (
          <div className="mt-6">
            <h4 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg-soft">Made from</h4>
            <ul className="mt-2 space-y-1.5 text-sm">
              {record.inputs.map((input, index) => (
                <li key={`${input.item_id ?? index}`} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.04em] text-dim">{input.role}</span>
                  {input.available && input.item_id ? (
                    <Link href={`/library?tab=uploaded&item=${input.item_id}`} className="text-blue hover:text-gold-soft">
                      {input.name}
                    </Link>
                  ) : (
                    <span className="text-muted">
                      {input.name || "a file"} — <span className="text-danger">no longer in your library</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {missing.length > 0 && (
              <p className="mt-2 text-xs text-dim">
                This video still plays; it is its own copy. Reopening it brings back everything that is left — to
                make the same thing again, upload the missing file first.
              </p>
            )}
          </div>
        )}

        {/* The request, exactly as the platform received it */}
        <div className="mt-6">
          <h4 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg-soft">The request</h4>
          {failed ? (
            <p className="mt-2 text-sm text-muted">
              No recorded request for this one. Generations made before the platform started keeping them have none.
            </p>
          ) : !record ? (
            <p className="mt-2 text-sm text-muted">Loading…</p>
          ) : (
            <>
              <div className="relative mt-2">
                <CopyButton text={pretty} />
                <pre className="max-h-64 overflow-auto rounded-[10px] border border-line-strong bg-raised p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-xs text-fg">
                  <code>{pretty}</code>
                </pre>
              </div>
              {record.links_expired && (
                <p className="mt-2 text-xs text-dim">
                  The links this carried have expired, so they are shown as placeholders. The snippet below mints fresh
                  ones from your library first.
                </p>
              )}
              <div className="relative mt-3">
                <CopyButton text={record.curl} />
                <pre className="max-h-64 overflow-auto rounded-[10px] border border-line-strong bg-raised p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-xs text-fg">
                  <code>{record.curl}</code>
                </pre>
              </div>
            </>
          )}
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-6" onClick={() => setConfirmDelete(false)}>
            <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Delete this video?</h3>
              <p className="mt-2 text-sm text-muted">
                The stored copy is removed and stops costing storage. What you paid to generate it stays in your usage
                history, and the request above remains, so you can make it again.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(false)} className={button}>Cancel</button>
                <button
                  onClick={() => { setConfirmDelete(false); void remove(); }}
                  className="rounded-none bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
