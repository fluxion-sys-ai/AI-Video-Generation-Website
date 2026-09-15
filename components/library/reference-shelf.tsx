"use client";

// The video and audio a customer keeps for reference-to-video generations.
//
// The image grid on the library page is for stills; these are clips and sound,
// which are worth showing as themselves: playable, with the length and codec
// the backend measured, because those are exactly what a model accepts or
// refuses. What they cost to keep is shown too, at the price the backend
// charges for storage - no figure here is written into the page.

import { useState } from "react";
import { deleteLibraryImage, uploadLibraryMedia, type LibraryItem } from "@/lib/hub";
import { getLibraryLimits, getLibraryMedia, refreshLibrary } from "@/lib/prefs";
import { useLive } from "@/lib/live";
import { money } from "@/lib/rate-card";
import { toast } from "@/lib/toast";

const button =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none transition-colors hover:border-blue hover:text-blue disabled:cursor-not-allowed disabled:opacity-50";

function measurements(item: LibraryItem): string {
  const bits: string[] = [];
  if (item.duration_seconds != null) bits.push(`${Number(item.duration_seconds.toFixed(2))}s`);
  else bits.push("length unknown");
  if (item.width && item.height) bits.push(`${item.width}x${item.height}`);
  if (item.codec) bits.push(item.codec.toUpperCase());
  else if (item.audio_codec) bits.push(item.audio_codec.toUpperCase());
  bits.push(`${(item.bytes / 1048576).toFixed(1)} MB`);
  if (item.uses) bits.push(`used ${item.uses}x`);
  return bits.join(" · ");
}

export function ReferenceShelf() {
  useLive("library", refreshLibrary);
  const [busy, setBusy] = useState(false);
  const videos = getLibraryMedia("video");
  const audios = getLibraryMedia("audio");
  const limits = getLibraryLimits();
  const stored = [...videos, ...audios].reduce((sum, item) => sum + item.bytes, 0);
  const monthly = limits ? (stored / 1024 ** 3) * limits.storage_usd_per_gb_month : null;

  async function add(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    for (const file of files) {
      try {
        await uploadLibraryMedia(file, { name: file.name });
      } catch (err) {
        toast(err instanceof Error ? err.message : `Could not upload ${file.name}.`);
      }
    }
    await refreshLibrary().catch(() => {});
    setBusy(false);
  }

  async function remove(item: LibraryItem) {
    try {
      await deleteLibraryImage(item.id);
      await refreshLibrary();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not delete that file.");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Reference material</h2>
        <p className="text-xs text-dim">
          {videos.length} video · {audios.length} audio
          {monthly !== null && stored > 0 && (
            <>
              {" · "}
              {(stored / 1048576).toFixed(1)} MB, {money(monthly)} a month to keep
            </>
          )}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Clips and sound a model can follow. Upload anything; a model&apos;s own limits are checked when you use a file
        for a generation, and the page tells you then.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className={`${button} cursor-pointer`}>
          {busy ? "Uploading…" : "Upload video"}
          <input
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void add(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
        <label className={`${button} cursor-pointer`}>
          {busy ? "Uploading…" : "Upload audio"}
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void add(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {videos.length + audios.length === 0 ? (
        <p className="mt-4 border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Nothing here yet.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...videos, ...audios].map((item) => (
            <li key={item.id} className="border border-line bg-surface/60 p-3">
              {item.kind === "video" ? (
                <video src={item.url} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" />
              ) : (
                <audio src={item.url} controls preload="metadata" className="w-full" />
              )}
              <p className="mt-2 truncate text-sm text-fg" title={item.name}>
                {item.name}
              </p>
              <p className="text-xs text-muted">{measurements(item)}</p>
              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => void remove(item)} className="border border-line-strong px-2 py-1 text-xs text-fg-soft hover:border-danger hover:text-danger">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
