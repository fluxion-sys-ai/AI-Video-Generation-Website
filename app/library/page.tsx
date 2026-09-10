"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { isSignedIn } from "@/lib/auth";
import { getModels, type Model } from "@/lib/models";
import {
  getFavorites,
  getRecents,
  setPendingImages,
  getLibraryImages,
  saveLibraryImages,
  addLibraryImages,
  isAutoplay,
  type LibImage,
} from "@/lib/prefs";
import { useEscapeKey } from "@/lib/use-escape-key";

type VideoItem = { id: number; prompt: string; model: Model; when: string };

// Video card: the model poster is an <img> thumbnail that always loads; the
// actual clip is only mounted (and plays) while hovering, so it never covers the
// thumbnail with a black first frame.
function VideoThumb({ v }: { v: VideoItem }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/generate?model=${v.model.slug}`}
      onMouseEnter={() => { if (isAutoplay()) setHover(true); }}
      onMouseLeave={() => setHover(false)}
      className="group border border-line p-3 transition-colors hover:border-[rgba(124,189,242,0.5)]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.model.poster} alt="" className="h-full w-full object-cover" />
        {hover && (
          <video
            src={v.model.demoVideo}
            poster={v.model.poster}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      <p className="mt-3 truncate text-sm text-fg">{v.prompt}</p>
      <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-gold">{v.model.name} · {v.when}</p>
    </Link>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"videos" | "images">("videos");

  // Image selection + "upload to a model" flow.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [modelFilter, setModelFilter] = useState<"all" | "recents" | "favorites">("all");
  const [modelQuery, setModelQuery] = useState("");

  // Persisted library images (samples + everything the user has uploaded,
  // including uploads made inside a model's playground).
  const [libImages, setLibImages] = useState<LibImage[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Delete confirmation (holds the ids queued for deletion).
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  // Right-click context menu on an image.
  const [ctx, setCtx] = useState<{ x: number; y: number; id: string } | null>(null);
  // Right-click context menu on a folder tab.
  const [folderCtx, setFolderCtx] = useState<{ x: number; y: number; id: string } | null>(null);

  // Folders for organizing images (drag an image onto a folder). Persisted.
  type Folder = { id: string; name: string; imageIds: string[] };
  const FOLDERS_KEY = "fluxion.libraryFolders";
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [addFolderOpen, setAddFolderOpen] = useState(false);

  const models = getModels();

  // Esc closes any open menu / modal.
  useEscapeKey(() => {
    setCtx(null);
    setFolderCtx(null);
    setDeleteIds(null);
    setDeleteFolderId(null);
    setAddFolderOpen(false);
    setUploadOpen(false);
  });

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/library");
      return;
    }
    // Load images; seed with sample references on first visit.
    let imgs = getLibraryImages();
    if (imgs.length === 0) {
      imgs = models.flatMap((m) => [
        { id: `${m.slug}-a`, src: m.poster, name: `${m.slug}-ref-01.jpg`, model: m.slug },
        { id: `${m.slug}-b`, src: m.poster, name: `${m.slug}-ref-02.jpg`, model: m.slug },
      ]);
      saveLibraryImages(imgs);
    } else {
      // Migrate old entries that referenced the now-dead external sample bucket
      // to the self-hosted model poster.
      let changed = false;
      imgs = imgs.map((im) => {
        if (im.src.includes("gtv-videos-bucket") && im.model) {
          const local = models.find((m) => m.slug === im.model)?.poster;
          if (local) { changed = true; return { ...im, src: local }; }
        }
        return im;
      });
      if (changed) saveLibraryImages(imgs);
    }
    // Load folders and prune any stale/duplicate image ids (self-heals bad data
    // left in storage before the count fix) against the images that exist.
    let loaded: Folder[] = [];
    try {
      const raw = localStorage.getItem(FOLDERS_KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const idSet = new Set(imgs.map((i) => i.id));
    const cleaned = loaded.map((f) => ({ ...f, imageIds: [...new Set((f.imageIds || []).filter((id) => idSet.has(id)))] }));
    setFolders(cleaned);
    setLibImages(imgs);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const prompts = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
    "Timelapse of clouds over a mountain ridge",
    "Macro shot of ink blooming in water",
    "Drone flyover of a foggy pine forest",
  ];
  const videos = prompts.map((p, i) => ({ id: i, prompt: p, model: models[i % models.length], when: ["2h ago", "Yesterday", "3 days ago", "Last week", "Last week", "2 weeks ago"][i] }));

  // ---- folder helpers -------------------------------------------------------
  // All mutations use functional updates so concurrent/async ops (e.g. dropping
  // or uploading several images) compose correctly instead of clobbering each
  // other via a stale `folders` closure (that caused off-by-one counts).
  // Persistence is handled by the effect below, keyed on `folders`.
  function createFolder(name: string) {
    const n = name.trim();
    if (!n) return;
    setFolders((prev) => [...prev, { id: `f${Date.now()}`, name: n, imageIds: [] }]);
    setNewFolderName("");
    setCreatingFolder(false);
  }
  function addToFolder(folderId: string, imageId: string) {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? (f.imageIds.includes(imageId) ? f : { ...f, imageIds: [...f.imageIds, imageId] }) : f)),
    );
  }
  function removeFromFolder(folderId: string, imageId: string) {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, imageIds: f.imageIds.filter((x) => x !== imageId) } : f)));
  }
  function deleteFolder(folderId: string) {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (activeFolder === folderId) setActiveFolder(null);
  }
  // Add all currently-selected images to a folder (from select mode).
  function addSelectedToFolder(folderId: string) {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, imageIds: [...new Set([...f.imageIds, ...selected])] } : f)));
    setAddFolderOpen(false);
    exitSelect();
  }

  // Persist folders whenever they change (skips the initial hydrate render so it
  // never overwrites stored folders with the empty initial state).
  const foldersHydrated = useRef(false);
  useEffect(() => {
    if (!foldersHydrated.current) {
      foldersHydrated.current = true;
      return;
    }
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch {
      /* storage may be unavailable */
    }
  }, [folders]);

  // ---- image helpers --------------------------------------------------------
  // A folder's real count = its ids that still exist in the library, deduped.
  // (Guards against stale/duplicate ids left over in storage.)
  const libIdSet = new Set(libImages.map((i) => i.id));
  const folderCount = (f: Folder) => new Set(f.imageIds.filter((id) => libIdSet.has(id))).size;

  const activeFolderObj = folders.find((f) => f.id === activeFolder) || null;
  const shownImages = activeFolderObj ? libImages.filter((img) => activeFolderObj.imageIds.includes(img.id)) : libImages;

  const allSelected = selected.size > 0 && shownImages.every((i) => selected.has(i.id));
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(shownImages.map((i) => i.id)));
  }
  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }
  // Add uploaded files (data URLs). If viewing a folder, file them into it.
  function onUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item: LibImage = { id: `u${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src: String(reader.result), name: f.name };
        addLibraryImages([item]);
        setLibImages((prev) => [item, ...prev]);
        if (activeFolder) addToFolder(activeFolder, item.id);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }
  function deleteImages(ids: string[]) {
    const set = new Set(ids);
    setLibImages((prev) => {
      const next = prev.filter((i) => !set.has(i.id));
      saveLibraryImages(next);
      return next;
    });
    setFolders((prev) => prev.map((f) => ({ ...f, imageIds: f.imageIds.filter((x) => !set.has(x)) })));
    setSelected(new Set());
    setDeleteIds(null);
  }
  // Queue selected images for the chosen model, then open its playground.
  function uploadTo(model: Model) {
    const chosen = libImages.filter((img) => selected.has(img.id)).map((img) => ({ url: img.src, name: img.name }));
    setPendingImages(chosen);
    router.push(`/generate?model=${model.slug}`);
  }

  function modelsForFilter(): Model[] {
    const bySlug = (slug: string) => models.find((m) => m.slug === slug);
    if (modelFilter === "recents") return getRecents().map(bySlug).filter(Boolean) as Model[];
    if (modelFilter === "favorites") return getFavorites().map(bySlug).filter(Boolean) as Model[];
    return models;
  }
  const mq = modelQuery.trim().toLowerCase();
  const modelResults = modelsForFilter().filter((m) => !mq || `${m.name} ${m.tagline}`.toLowerCase().includes(mq));

  if (!ready) return <div className="min-h-screen" />;

  const toolbarBtn = "rounded-none border border-hairline-strong px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg transition-colors hover:bg-hover";

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-10 py-10">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Library</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Your library</h1>
        <p className="mt-2 text-sm text-muted">Everything you&apos;ve generated and uploaded.</p>

        <div className="mt-8 flex gap-6 border-b border-hairline font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
          {(["videos", "images"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); exitSelect(); }}
              className={`-mb-px border-b-2 pb-3 transition-colors ${
                tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* VIDEOS — poster thumbnail always shown; hover plays the clip */}
        {tab === "videos" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoThumb key={v.id} v={v} />
            ))}
          </div>
        )}

        {/* IMAGES */}
        {tab === "images" && (
          <>
            {/* hidden file input for uploads */}
            <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={onUploadFiles} />

            {/* toolbar row: folder tabs (left) on the same line as the actions (right) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
              {/* left: All + folder tabs (drop targets) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`rounded-none border px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                    activeFolder === null ? "border-accent bg-accent-soft text-accent" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  All ({libImages.length})
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFolder(f.id)}
                    onContextMenu={(e) => { e.preventDefault(); setFolderCtx({ x: e.clientX, y: e.clientY, id: f.id }); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverFolder(f.id); }}
                    onDragLeave={() => setDragOverFolder((d) => (d === f.id ? null : d))}
                    onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) addToFolder(f.id, id); setDragOverFolder(null); }}
                    title="Click to view · right-click for options"
                    className={`flex items-center gap-1.5 rounded-none border px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                      dragOverFolder === f.id
                        ? "border-accent bg-accent-soft text-accent"
                        : activeFolder === f.id
                          ? "border-accent text-accent"
                          : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 4.5 A1 1 0 0 1 2.5 3.5 H6 L7.5 5 H13.5 A1 1 0 0 1 14.5 6 V12 A1 1 0 0 1 13.5 13 H2.5 A1 1 0 0 1 1.5 12 Z" stroke="currentColor" strokeWidth="1.2" /></svg>
                    {f.name} ({folderCount(f)})
                  </button>
                ))}
              </div>

              {/* right: action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {selectMode ? (
                  <>
                    <span className="text-sm text-muted">{selected.size} selected</span>
                    <button onClick={toggleAll} className={toolbarBtn}>{allSelected ? "Deselect all" : "Select all"}</button>
                    <button
                      onClick={() => setAddFolderOpen(true)}
                      disabled={selected.size === 0}
                      className={`${toolbarBtn} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Add to folder
                    </button>
                    <button
                      onClick={() => setUploadOpen(true)}
                      disabled={selected.size === 0}
                      className="rounded-none bg-accent px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Upload to model
                    </button>
                    <button
                      onClick={() => setDeleteIds([...selected])}
                      disabled={selected.size === 0}
                      aria-label="Delete selected"
                      title="Delete selected"
                      className="flex items-center justify-center rounded-none border border-[rgba(255,107,107,0.4)] px-3 py-2 text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.5M7 7v4M9 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button onClick={exitSelect} className="text-sm text-muted transition-colors hover:text-fg">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => uploadRef.current?.click()} className="rounded-none bg-accent px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover">
                      Upload {activeFolderObj ? "to folder" : "images"}
                    </button>
                    <button onClick={() => setSelectMode(true)} className={toolbarBtn}>Select</button>
                    {creatingFolder ? (
                      <>
                        <input
                          autoFocus
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") createFolder(newFolderName); if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); } }}
                          placeholder="Folder name"
                          className="rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
                        />
                        <button onClick={() => createFolder(newFolderName)} className="rounded-none bg-accent px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover">Add</button>
                        <button onClick={() => { setCreatingFolder(false); setNewFolderName(""); }} className="text-sm text-muted transition-colors hover:text-fg">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setCreatingFolder(true)} className="rounded-none border border-hairline-strong px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg transition-colors hover:border-accent hover:text-accent">
                        New folder +
                      </button>
                    )}
                    {activeFolderObj && (
                      <button
                        onClick={() => setDeleteFolderId(activeFolderObj.id)}
                        className="rounded-none border border-[rgba(255,107,107,0.4)] px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)]"
                      >
                        Delete folder
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {folders.length === 0 && !creatingFolder && (
              <p className="mt-2 text-xs text-dim">Tip: create a folder, then drag images onto it (or right-click an image) to organize them.</p>
            )}


            {/* image grid */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {shownImages.length === 0 ? (
                <p className="col-span-full text-sm text-dim">{activeFolderObj ? "This folder is empty. Drag images here, or upload into it." : "No images yet. Upload some to get started."}</p>
              ) : (
                shownImages.map((img) => {
                  const on = selected.has(img.id);
                  return (
                    <div
                      key={img.id}
                      draggable={!selectMode}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", img.id); e.dataTransfer.effectAllowed = "copy"; }}
                      onClick={() => selectMode && toggleOne(img.id)}
                      onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, id: img.id }); }}
                      className={`group block border p-2 text-left transition-colors ${
                        on ? "border-accent" : "border-line"
                      } ${selectMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt="" className={`h-full w-full object-cover transition-opacity ${on ? "opacity-80" : ""}`} draggable={false} />
                        {selectMode && (
                          <span
                            className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-ink transition-colors ${
                              on ? "border-accent bg-accent" : "border-white/70 bg-black/40"
                            }`}
                          >
                            {on && (
                              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate font-[family-name:var(--font-jetbrains)] text-[10px] text-dim">{img.name}</p>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>

      {/* Right-click context menu */}
      {ctx && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setCtx(null)} onContextMenu={(e) => { e.preventDefault(); setCtx(null); }} />
          <div
            className="fixed z-[66] min-w-44 rounded-[10px] border border-line bg-panel p-1 text-sm shadow-xl shadow-black/40"
            style={{ left: Math.min(ctx.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 190), top: ctx.y }}
          >
            {/* In select mode: only Select (toggles) + Delete. In regular mode:
                the full menu with folder options. */}
            <button
              onClick={() => {
                if (selectMode) { toggleOne(ctx.id); }
                else { setSelectMode(true); setSelected(new Set([ctx.id])); }
                setCtx(null);
              }}
              className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover"
            >
              {selectMode ? (selected.has(ctx.id) ? "Deselect" : "Select") : "Select"}
            </button>
            {!selectMode && activeFolderObj && (
              <button onClick={() => { removeFromFolder(activeFolderObj.id, ctx.id); setCtx(null); }} className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover">Remove from “{activeFolderObj.name}”</button>
            )}
            {!selectMode && folders.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.08em] text-dim">Add to folder</p>
                {folders.map((f) => (
                  <button key={f.id} onClick={() => { addToFolder(f.id, ctx.id); setCtx(null); }} className="block w-full truncate rounded-[7px] px-3 py-1.5 text-left text-fg transition-colors hover:bg-hover">{f.name}</button>
                ))}
              </>
            )}
            <button onClick={() => { const id = ctx.id; setCtx(null); setDeleteIds([id]); }} className="mt-1 block w-full rounded-[7px] border-t border-line px-3 py-2 text-left text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)]">Delete</button>
          </div>
        </>
      )}

      {/* Right-click context menu on a folder */}
      {folderCtx && (
        <>
          <div className="fixed inset-0 z-[65]" onClick={() => setFolderCtx(null)} onContextMenu={(e) => { e.preventDefault(); setFolderCtx(null); }} />
          <div
            className="fixed z-[66] min-w-40 rounded-[10px] border border-line bg-panel p-1 text-sm shadow-xl shadow-black/40"
            style={{ left: Math.min(folderCtx.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 176), top: folderCtx.y }}
          >
            <button onClick={() => { setActiveFolder(folderCtx.id); setFolderCtx(null); }} className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover">Open</button>
            <button onClick={() => { const id = folderCtx.id; setFolderCtx(null); setDeleteFolderId(id); }} className="mt-1 block w-full rounded-[7px] border-t border-line px-3 py-2 text-left text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)]">Delete folder</button>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteIds && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setDeleteIds(null)}>
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Delete {deleteIds.length} image{deleteIds.length === 1 ? "" : "s"}?</h3>
            <p className="mt-2 text-sm text-muted">This can&apos;t be undone. The image{deleteIds.length === 1 ? "" : "s"} will be removed from your library and any folders.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteIds(null)} className="rounded-[10px] border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Cancel</button>
              <button onClick={() => deleteImages(deleteIds)} className="rounded-[10px] bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete-folder confirmation */}
      {deleteFolderId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setDeleteFolderId(null)}>
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
              Delete “{folders.find((f) => f.id === deleteFolderId)?.name}” folder?
            </h3>
            <p className="mt-2 text-sm text-muted">The folder is removed. Your images stay in the library.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteFolderId(null)} className="rounded-[10px] border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Cancel</button>
              <button onClick={() => { deleteFolder(deleteFolderId); setDeleteFolderId(null); }} className="rounded-[10px] bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover">Delete folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Add-to-folder picker (from select mode) */}
      {addFolderOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setAddFolderOpen(false)}>
          <div className="flex w-full max-w-sm flex-col rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Add to folder</h3>
            <p className="mt-1 text-xs text-dim">{selected.size} image{selected.size === 1 ? "" : "s"} → pick a folder.</p>
            <div className="mt-4 h-56 overflow-y-auto border border-line">
              {folders.length === 0 ? (
                <p className="p-4 text-sm text-dim">No folders yet. Create one first (New folder +).</p>
              ) : (
                folders.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => addSelectedToFolder(f.id)}
                    className={`flex w-full items-center gap-2 p-3 text-left text-sm text-fg transition-colors hover:bg-hover ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 4.5 A1 1 0 0 1 2.5 3.5 H6 L7.5 5 H13.5 A1 1 0 0 1 14.5 6 V12 A1 1 0 0 1 13.5 13 H2.5 A1 1 0 0 1 1.5 12 Z" stroke="currentColor" strokeWidth="1.2" /></svg>
                    <span className="flex-1 truncate font-[family-name:var(--font-jetbrains)] uppercase tracking-[0.04em]">{f.name}</span>
                    <span className="text-xs text-dim">({folderCount(f)})</span>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setAddFolderOpen(false)} className="mt-4 self-end text-sm text-muted transition-colors hover:text-fg">Cancel</button>
          </div>
        </div>
      )}

      {/* Upload-to-model modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6" onClick={() => setUploadOpen(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Upload to a model</h3>
            <p className="mt-1 text-xs text-dim">{selected.size} image{selected.size === 1 ? "" : "s"} → the model&apos;s playground.</p>

            <div className="mt-4 flex gap-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
              {(["all", "recents", "favorites"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setModelFilter(f)}
                  className={`rounded-none border px-3 py-1.5 transition-colors ${
                    modelFilter === f ? "border-accent bg-accent-soft text-accent" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="relative mt-3">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder="Search models"
                className="w-full rounded-none border border-line-strong bg-raised py-2 pl-8 pr-2 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
              />
            </div>

            <div className="mt-3 h-72 shrink-0 overflow-y-auto border border-line">
              {modelResults.length === 0 ? (
                <p className="p-4 text-sm text-dim">
                  {modelFilter === "recents" ? "No recent models yet." : modelFilter === "favorites" ? "No favorite models yet." : `No models match “${modelQuery}”.`}
                </p>
              ) : (
                modelResults.map((m, i) => (
                  <button
                    key={m.slug}
                    onClick={() => uploadTo(m)}
                    className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-hover ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent">
                      {m.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{m.name}</span>
                      <span className="block truncate text-xs text-dim">{m.tagline}</span>
                    </span>
                    <span className="shrink-0 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-blue">Upload →</span>
                  </button>
                ))
              )}
            </div>

            <button onClick={() => setUploadOpen(false)} className="mt-4 self-end text-sm text-muted transition-colors hover:text-fg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
