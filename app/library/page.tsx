"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GlowBlobs } from "@/components/decor/glow-blobs";
import { isSignedIn } from "@/lib/auth";
import { getModels, getModel, type Model, refreshCatalog } from "@/lib/models";
import { getGenerations, refreshGenerations, formatWhen, type Generation } from "@/lib/generations";
import { ApiError, BACKEND_ENABLED } from "@/lib/hub";
import { useLive, useLiveState } from "@/lib/live";
import {
  getFavorites,
  getRecents,
  setPendingImages,
  getLibraryImages,
  saveLibraryImages,
  addLibraryImages,
  getUploads,
  getLibraryLimits,
  refreshLibrary,
  getLibraryFolders,
  setUploadPortrait,
  uploadFiles,
  removeLibraryImages,
  renameUpload,
  setImageFavourite,
  setImageFolder,
  markImageUsed,
  saveLibraryOrder,
  addLibraryFolder,
  removeLibraryFolder,
  renameLibraryFolderByName,
  isAutoplay,
  type LibImage,
  type Upload,
} from "@/lib/prefs";
import { useEscapeKey } from "@/lib/use-escape-key";
import { toast } from "@/lib/toast";
import { money } from "@/lib/rate-card";
import { Heart, ImageIcon, FolderOpen, Search, Clapperboard, Music, Film } from "lucide-react";
import { KindSwitch, type Kind } from "@/components/ui/kind-switch";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerationRecordPanel } from "@/components/library/generation-record";
import { SkeletonImg } from "@/components/ui/skeleton";

// Video card. The clip itself is the thumbnail: mounted with preload="metadata"
// so the browser paints *this* video's first frame rather than the model's stock
// image, which told you nothing about what you made. Hovering plays it.
function VideoThumb({ g, onOpen }: { g: Generation; onOpen: (g: Generation) => void }) {
  const player = useRef<HTMLVideoElement | null>(null);
  const modelName = getModel(g.slug)?.name ?? g.slug;
  return (
    // A history entry opens the record of *this* video - the clip, what it was
    // made from, and the request that made it - rather than an empty playground.
    <button
      type="button"
      onClick={() => onOpen(g)}
      onMouseEnter={() => { if (isAutoplay()) void player.current?.play().catch(() => {}); }}
      onMouseLeave={() => {
        const el = player.current;
        if (!el) return;
        el.pause();
        el.currentTime = 0;
      }}
      className="group border border-line p-3 text-left transition-colors hover:border-blue-line"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {g.videoUrl && g.kind === "image" ? (
          // A generated image. Contained rather than cropped: a 1:16 banner
          // filled to a 16:9 tile would show a stripe out of the middle of it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.videoUrl} alt={g.prompt} className="h-full w-full object-contain" />
        ) : g.videoUrl ? (
          <video
            ref={player}
            src={g.videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // Nothing to show a frame from (a demo entry, or a stored copy that
          // has gone); the model's image is better than a black square.
          <SkeletonImg src={g.poster} imgClassName="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-3 truncate text-sm text-fg">{g.prompt}</p>
      <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-gold">{modelName} · {formatWhen(g.createdAt)}</p>
    </button>
  );
}

// "6s · 1280x720 · H264" or "4s · MP3": what the backend measured, where it
// could. An unmeasured file says nothing rather than guessing.
function describeUpload(item: Upload): string {
  const bits: string[] = [];
  if (item.kind !== "image" && item.duration != null) bits.push(`${Number(item.duration.toFixed(2))}s`);
  if (item.width && item.height) bits.push(`${item.width}x${item.height}`);
  if (item.kind !== "image" && item.codec) bits.push(item.codec.toUpperCase());
  if (item.size) bits.push(item.size > 1048576 ? `${(item.size / 1048576).toFixed(1)} MB` : `${Math.round(item.size / 1024)} KB`);
  return bits.join(" · ");
}

// A tile's preview. A video shows its own first frame (preload=metadata) and
// plays on hover like the generated clips do; audio has nothing to show, so it
// says what it is.
/**
 * Making a stored image into a portrait, or stopping it being one.
 *
 * Registering queues it for the provider's review and takes a slot of a bought
 * allowance; unregistering removes it from them immediately and cannot be
 * undone. The file is untouched either way, so changing your mind costs the
 * preparation again and nothing else - which the confirmation says rather than
 * leaving somebody to find out.
 */
function PortraitToggle({ item, onDone }: { item: Upload; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const state = item.character;
  const box =
    "rounded-none border border-white/40 px-2 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-white transition-colors hover:border-white hover:bg-white/10 disabled:opacity-50";

  async function run(on: boolean) {
    if (!on) {
      const ok = window.confirm(
        `Stop using "${item.name}" as a portrait?\n\n` +
          "It is removed from the video provider immediately and that cannot be undone. " +
          "The image stays in your library, so you can register it again — it just has to be prepared from scratch.",
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      await setUploadPortrait(item.id, on);
      toast(on ? "Preparing as a portrait — usually a few minutes." : "No longer a portrait.");
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not change that.");
    } finally {
      setBusy(false);
    }
  }

  if (state) {
    return (
      <button type="button" disabled={busy} onClick={() => void run(false)} className={box}>
        {state.status === "failed" ? "Remove failed portrait" : "Not a portrait"}
      </button>
    );
  }
  return (
    <button type="button" disabled={busy} onClick={() => void run(true)} className={box}>
      Make a portrait
    </button>
  );
}

/**
 * What the grid shows while the first load is in flight.
 *
 * Shaped like the thing it stands in for - same grid, same square tiles, same
 * two lines of caption - so nothing jumps when the real items arrive. Six is
 * one row at the widest layout and more than a screenful at the narrowest,
 * which is enough to read as "loading" without pretending to know the count.
 */
function LoadingGrid({ label }: { label: string }) {
  return (
    <div className="mt-5">
      <p className="sr-only" role="status" aria-live="polite">{label}</p>
      <div className="lib-grid grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="skeleton relative aspect-square w-full overflow-hidden" />
            <div className="skeleton mt-2 h-2.5 w-3/4" />
            <div className="skeleton mt-1 h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadPreview({ item, dimmed }: { item: Upload; dimmed: boolean }) {
  const player = useRef<HTMLVideoElement | null>(null);
  const dim = dimmed ? "opacity-80" : "";
  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.url} alt="" className={`h-full w-full object-cover transition-opacity ${dim}`} draggable={false} />
    );
  }
  if (item.kind === "video") {
    return (
      <div
        className="h-full w-full"
        // The clip stays mounted so its first frame is the thumbnail; hovering
        // plays it. Toggling `autoPlay` on a mounted video does nothing, so
        // this asks the element directly.
        onMouseEnter={() => {
          if (isAutoplay()) void player.current?.play().catch(() => {});
        }}
        onMouseLeave={() => {
          const el = player.current;
          if (!el) return;
          el.pause();
          el.currentTime = 0;
        }}
      >
        <video
          ref={player}
          src={item.url}
          muted
          loop
          playsInline
          preload="metadata"
          className={`h-full w-full object-cover transition-opacity ${dim}`}
        />
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-[6px] bg-black/70 px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] text-white">
          <Film size={9} />
          {item.duration != null ? `${Math.round(item.duration)}s` : "video"}
        </span>
      </div>
    );
  }
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-panel ${dim}`}>
      <Music size={26} className="text-gold" />
      <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-muted">
        {item.duration != null ? `${Math.round(item.duration)}s audio` : "audio"}
      </span>
    </div>
  );
}

function LibraryInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  // Two things live here: what the platform generated for you (videos), and
  // what you uploaded (images, video and audio - anything a model can be given).
  // Generated first: the library is mostly visited to see what you made.
  const [tab, setTab] = useState<"generated" | "uploaded">("generated");

  // Image selection + "upload to a model" flow.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  // Whether the next upload should also be registered with the video provider
  // as a portrait. Asked here because this is where the decision belongs: it
  // costs a slot of a purchased allowance, and the playground only ever picks
  // one that already exists.
  const [uploadPortrait, setUploadPortrait] = useState(false);
  // The dialog that asks what is being added. It exists because the answer
  // changes what happens to the file - a portrait is registered with the video
  // provider, takes minutes to settle and uses a slot of a bought allowance -
  // and a question with consequences deserves to be asked rather than left
  // sitting as a control somebody may not have noticed.
  const [askingUpload, setAskingUpload] = useState(false);
  const [consented, setConsented] = useState(false);
  const [modelFilter, setModelFilter] = useState<"all" | "recents" | "favorites">("all");
  const [modelQuery, setModelQuery] = useState("");

  // Everything the customer uploaded: images, and - with a backend - video and
  // audio too, in one list so one grid can show them all.
  const [uploads, setUploads] = useState<Upload[]>([]);
  // Renaming a file or a folder (the same dialog; the only thing a customer can
  // edit about either).
  const [renaming, setRenaming] = useState<{ id: string; name: string; target: "upload" | "folder" } | null>(null);
  // Raised when the backend says a file about to be deleted was used to make a
  // video; deleting anyway is a second, informed click.
  const [usedWarning, setUsedWarning] = useState<{ ids: string[]; message: string } | null>(null);
  // Past generations (the Generated tab). Source of truth: lib/generations.
  const [gens, setGens] = useState<Generation[]>([]);
  // Which of them to show. A clip and a picture are made by different models,
  // read differently and are looked for separately, so they are two lists
  // rather than one mixed grid - and the switch appears only once there is
  // something of each, which for most accounts is never.
  const [genKind, setGenKind] = useState<Kind>("video");
  // The generated video whose record is open, if any. ?video=<task id> opens
  // one directly, which is what a usage-history entry links to.
  const [record, setRecord] = useState<Generation | null>(null);
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
  // Expanded image viewer (click an image to open; × / Esc / backdrop to close).
  const [imgLightbox, setImgLightbox] = useState<Upload | null>(null);

  // Image search + sort.
  type SortKey = "custom" | "name" | "recent" | "size" | "uses";
  const [imgQuery, setImgQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("custom");
  const [dragOverImg, setDragOverImg] = useState<string | null>(null);

  const models = getModels();

  // Esc closes any open menu / modal.
  useEscapeKey(() => {
    setCtx(null);
    setFolderCtx(null);
    setDeleteIds(null);
    setDeleteFolderId(null);
    setAddFolderOpen(false);
    setUploadOpen(false);
    setRenaming(null);
    // Both of these are in the URL, so closing them has to leave it too, or a
    // later refresh would find the parameter still there and reopen them.
    closeItem();
    closeRecord();
  });

  /**
   * What is open lives in the URL, and that is what makes Back work.
   *
   * A generated video's record is ?video=<task id>; a file opened from it - the
   * "made from" links - is ?tab=uploaded&item=<id>. So going back from a file
   * lands on the record it was reached from, with that record open again,
   * instead of dumping you on the library's front page.
   */
  function openRecord(g: Generation) {
    setRecord(g);
    router.push(`/library?tab=generated&video=${g.id}`);
  }
  function closeRecord() {
    setRecord(null);
    if (search.get("video")) router.replace("/library?tab=generated");
  }
  function openItem(item: Upload) {
    setImgLightbox(item);
    router.push(`/library?tab=uploaded&item=${item.id}`);
  }
  function closeItem() {
    setImgLightbox(null);
    if (search.get("item")) router.replace("/library?tab=uploaded");
  }

  // Open the tab named in ?tab= (from the header Library menu). Reacts to query
  // changes too, so navigating Videos → Images updates without a remount.
  useEffect(() => {
    // The tabs were called "images" and "videos", and reference material had a
    // tab of its own; old links still work.
    const t = search.get("tab");
    if (t === "generated" || t === "videos") setTab("generated");
    else if (t === "uploaded" || t === "images" || t === "reference") setTab("uploaded");
    const video = search.get("video");
    if (video) setTab("generated");
    if (search.get("item")) setTab("uploaded");
  }, [search]);

  // Follow the URL: ?video= opens that record, ?item= opens that file, and the
  // absence of either closes what was open - which is how the Back button gets
  // to close a panel it did not open.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const video = search.get("video");
    if (!video) setRecord(null);
    else {
      const found = gens.find((g) => g.id === video);
      if (found) setRecord(found);
    }
    const item = search.get("item");
    if (!item) setImgLightbox(null);
    else {
      const found = uploads.find((u) => u.id === item);
      if (found) setImgLightbox(found);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [search, gens, uploads]);

  // Backend mode: images, folders and videos come from the server. These hooks
  // refresh them on mount and re-render whenever they change.
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  // `ready` matters more than the version here: until the first load lands,
  // "you have nothing" and "we have not looked yet" are the same state to this
  // component and opposite things to a person reading it.
  const { version: libraryVersion, ready: libraryReady } =
    useLiveState("library", BACKEND_ENABLED ? refreshLibrary : undefined);
  const { version: generationsVersion, ready: generationsReady } =
    useLiveState("generations", BACKEND_ENABLED ? refreshGenerations : undefined);
  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    // The seams have already loaded; copying their caches into state is what
    // re-renders the page, and local edits below stay optimistic until the next
    // refresh lands. Same shape as the hydration effects further down.
    /* eslint-disable react-hooks/set-state-in-effect */
    setUploads(getUploads());
    setFolders(getLibraryFolders());
    setGens(getGenerations());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [libraryVersion, generationsVersion]);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/library");
      return;
    }
    if (BACKEND_ENABLED) {
      setReady(true);
      return;
    }
    // Load images; seed with sample references on first visit.
    let imgs = getLibraryImages();
    if (imgs.length === 0) {
      const base = Date.UTC(2026, 8, 1);
      imgs = models.flatMap((m, mi) => [
        { id: `${m.slug}-a`, src: m.poster, name: `${m.slug}-ref-01.jpg`, model: m.slug, size: 210000 + mi * 9000, uses: 0, addedAt: base + mi * 2 * 86400000 },
        { id: `${m.slug}-b`, src: m.poster, name: `${m.slug}-ref-02.jpg`, model: m.slug, size: 180000 + mi * 7000, uses: 0, addedAt: base + (mi * 2 + 1) * 86400000 },
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
    setUploads(getUploads());
    setGens(getGenerations());
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ---- folder helpers -------------------------------------------------------
  // All mutations use functional updates so concurrent/async ops (e.g. dropping
  // or uploading several images) compose correctly instead of clobbering each
  // other via a stale `folders` closure (that caused off-by-one counts).
  // Persistence is handled by the effect below, keyed on `folders`.
  function createFolder(name: string) {
    const n = name.trim();
    if (!n) return;
    if (BACKEND_ENABLED) {
      void addLibraryFolder(n).catch((err) => toast(err instanceof Error ? err.message : "Could not create the folder."));
    } else {
      setFolders((prev) => [...prev, { id: `f${Date.now()}`, name: n, imageIds: [] }]);
    }
    setNewFolderName("");
    setCreatingFolder(false);
  }
  function addToFolder(folderId: string, imageId: string) {
    if (BACKEND_ENABLED) {
      void setImageFolder(imageId, folderId).catch(() => toast("Could not move that image."));
      return;
    }
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? (f.imageIds.includes(imageId) ? f : { ...f, imageIds: [...f.imageIds, imageId] }) : f)),
    );
  }
  function removeFromFolder(folderId: string, imageId: string) {
    if (BACKEND_ENABLED) {
      void setImageFolder(imageId, null).catch(() => toast("Could not remove that image from the folder."));
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, imageIds: f.imageIds.filter((x) => x !== imageId) } : f)));
  }
  function deleteFolder(folderId: string) {
    if (BACKEND_ENABLED) {
      void removeLibraryFolder(folderId).catch(() => toast("Could not delete the folder."));
    } else {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    }
    if (activeFolder === folderId) setActiveFolder(null);
  }
  // Add all currently-selected images to a folder (from select mode).
  function addSelectedToFolder(folderId: string) {
    if (BACKEND_ENABLED) {
      void Promise.all([...selected].map((id) => setImageFolder(id, folderId))).catch(() => toast("Could not move those images."));
      setAddFolderOpen(false);
      exitSelect();
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, imageIds: [...new Set([...f.imageIds, ...selected])] } : f)));
    setAddFolderOpen(false);
    exitSelect();
  }

  // Persist folders whenever they change (skips the initial hydrate render so it
  // never overwrites stored folders with the empty initial state).
  const foldersHydrated = useRef(false);
  // In backend mode folders live on the server, so skip the localStorage mirror.
  useEffect(() => {
    if (BACKEND_ENABLED) return;
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
  const libIdSet = new Set(uploads.map((i) => i.id));
  const folderCount = (f: Folder) => new Set(f.imageIds.filter((id) => libIdSet.has(id))).size;

  const activeFolderObj = folders.find((f) => f.id === activeFolder) || null;

  // What's displayed: search matches by name across ALL images (so results can
  // surface from any folder); otherwise the active folder (or everything). Then
  // apply the chosen sort.
  const iq = imgQuery.trim().toLowerCase();
  const searching = iq.length > 0;
  function sortImages(list: Upload[]): Upload[] {
    const arr = [...list];
    switch (sortKey) {
      case "name": return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "recent": return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      case "size": return arr.sort((a, b) => (b.size || 0) - (a.size || 0));
      case "uses": return arr.sort((a, b) => (b.uses || 0) - (a.uses || 0));
      default: return arr; // custom = stored order
    }
  }
  const baseImages = searching
    ? uploads.filter((im) => im.name.toLowerCase().includes(iq))
    : activeFolder === "favorites"
      ? uploads.filter((im) => im.fav)
      : activeFolderObj
        ? uploads.filter((im) => activeFolderObj.imageIds.includes(im.id))
        : uploads;
  const shownImages = sortImages(baseImages);

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
  // A portrait being prepared settles at the provider, not here, so nothing
  // would tell this page about it. Look again while any is still in flight and
  // stop the moment none is: a library of finished files should not poll.
  const preparing = uploads.some(
    (u) => u.character?.status === "pending" || u.character?.status === "processing",
  );
  useEffect(() => {
    if (!BACKEND_ENABLED || !preparing) return;
    const timer = setInterval(() => {
      void refreshLibrary()
        .then(() => setUploads(getUploads()))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [preparing]);

  function startUpload() {
    if (!BACKEND_ENABLED) {
      // Demo mode registers nothing, so there is nothing to ask about.
      uploadRef.current?.click();
      return;
    }
    setUploadPortrait(false);
    setConsented(false);
    setAskingUpload(true);
  }

  function chooseFiles() {
    if (uploadPortrait && !consented) {
      toast("Confirm you have the right to use this likeness first.");
      return;
    }
    setAskingUpload(false);
    uploadRef.current?.click();
  }

  // Add uploaded files. If viewing a folder, file them into it.
  function onUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (BACKEND_ENABLED) {
      const asPortrait = uploadPortrait;
      void uploadFiles(files, {
        folderId: activeFolder && activeFolder !== "favorites" ? activeFolder : undefined,
        character: asPortrait || undefined,
      })
        .then(() => {
          if (asPortrait) toast("Uploaded. Preparing as a portrait — usually a few minutes.");
        })
        .catch((err) => toast(err instanceof Error ? err.message : "Could not upload that file."));
      // One deliberate choice per batch: leaving it on would quietly register
      // the next set of screenshots somebody dropped in.
      setUploadPortrait(false);
      e.target.value = "";
      return;
    }
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item: LibImage = { id: `u${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src: String(reader.result), name: f.name, size: f.size, uses: 0, addedAt: Date.now() };
        addLibraryImages([item]);
        setUploads(getUploads());
        if (activeFolder) addToFolder(activeFolder, item.id);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }
  function deleteImages(ids: string[], confirm = false) {
    if (BACKEND_ENABLED) {
      void removeLibraryImages(ids, confirm)
        .then(() => {
          setUploads(getUploads());
          setUsedWarning(null);
        })
        .catch((err) => {
          // The backend refuses a file that a generation was made from, and
          // says which ones. That is a question for the customer, not an error.
          const detail = err instanceof ApiError && err.status === 409 ? err.message : null;
          if (detail) setUsedWarning({ ids, message: detail });
          else toast(err instanceof Error ? err.message : "Could not delete those files.");
        });
      setSelected(new Set());
      setDeleteIds(null);
      return;
    }
    const set = new Set(ids);
    saveLibraryImages(getLibraryImages().filter((i) => !set.has(i.id)));
    setUploads(getUploads());
    setFolders((prev) => prev.map((f) => ({ ...f, imageIds: f.imageIds.filter((x) => !set.has(x)) })));
    setSelected(new Set());
    setDeleteIds(null);
  }
  // Queue selected images for the chosen model, then open its playground.
  function uploadTo(model: Model) {
    // Only images travel this way; reference video and audio are chosen on the
    // Generate page itself, against a model's rules. The id goes with them so
    // the playground can select the stored file, not just display it.
    const chosen = uploads
      .filter((img) => selected.has(img.id) && img.kind === "image")
      .map((img) => ({ id: img.id, url: img.url, name: img.name }));
    setPendingImages(chosen);
    if (BACKEND_ENABLED) {
      void Promise.all([...selected].map((id) => markImageUsed(id))).catch(() => {});
      router.push(`/generate?model=${model.slug}`);
      return;
    }
    // Bump "use frequency" for the images sent.
    saveLibraryImages(getLibraryImages().map((im) => (selected.has(im.id) ? { ...im, uses: (im.uses || 0) + 1 } : im)));
    setUploads(getUploads());
    router.push(`/generate?model=${model.slug}`);
  }

  // Drag one image onto another to reorder (custom order). Persists + switches
  // the sort to "custom" so the new order is what's shown.
  function reorderImage(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const from = uploads.findIndex((i) => i.id === draggedId);
    const to = uploads.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...uploads];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setUploads(next);
    setSortKey("custom");
    if (BACKEND_ENABLED) {
      void saveLibraryOrder(next.map((i) => i.id)).catch(() => {});
      return;
    }
    const order = new Map(next.map((item, index) => [item.id, index]));
    saveLibraryImages([...getLibraryImages()].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
  }

  // The folder an image lives in (first match), shown as a badge in search results.
  const folderNameFor = (id: string) => folders.find((f) => f.imageIds.includes(id))?.name || null;

  // Heart / un-heart an image. When the last favorite is removed while on the
  // Favorites tab, fall back to All.
  function toggleImgFav(id: string) {
    const current = uploads.find((im) => im.id === id);
    if (BACKEND_ENABLED) {
      void setImageFavourite(id, !current?.fav).catch(() => toast("Could not update that file."));
      if (activeFolder === "favorites" && current?.fav && uploads.filter((im) => im.fav).length <= 1) setActiveFolder(null);
      return;
    }
    saveLibraryImages(getLibraryImages().map((im) => (im.id === id ? { ...im, fav: !im.fav } : im)));
    const next = getUploads();
    setUploads(next);
    if (activeFolder === "favorites" && !next.some((im) => im.fav)) setActiveFolder(null);
  }

  // Rename: the backend stores the name, so both modes go through the seam.
  function commitRename() {
    if (!renaming) return;
    const name = renaming.name.trim();
    const { id, target } = renaming;
    setRenaming(null);
    if (!name) return;
    if (target === "folder") {
      if (BACKEND_ENABLED) {
        void renameLibraryFolderByName(id, name).catch((err) => toast(err instanceof Error ? err.message : "Could not rename that folder."));
      } else {
        setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      }
      return;
    }
    void renameUpload(id, name)
      .then(() => setUploads(getUploads()))
      .catch((err) => toast(err instanceof Error ? err.message : "Could not rename that file."));
  }
  const favCount = uploads.filter((im) => im.fav).length;
  const counts = {
    image: uploads.filter((u) => u.kind === "image").length,
    video: uploads.filter((u) => u.kind === "video").length,
    audio: uploads.filter((u) => u.kind === "audio").length,
  };
  const storedBytes = uploads.reduce((sum, u) => sum + (u.size || 0), 0);
  const storageRate = getLibraryLimits()?.storage_usd_per_gb_month ?? null;
  const selectedImages = uploads.filter((u) => selected.has(u.id) && u.kind === "image").length;

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
        <div className="lib-head">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Library</span>
          <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Your library</h1>
          <p className="mt-2 text-sm text-muted">Everything you&apos;ve generated and uploaded.</p>
        </div>

        <div className="mt-8 flex gap-6 border-b border-hairline font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
          {(["generated", "uploaded"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); exitSelect(); }}
              className={`-mb-px border-b-2 pb-3 transition-colors ${
                tab === t ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* GENERATED: what the platform made. A clip shows its poster and plays
            on hover; a picture is simply itself. */}
        {tab === "generated" && (() => {
          const counts = {
            video: gens.filter((g) => g.kind !== "image").length,
            image: gens.filter((g) => g.kind === "image").length,
          };
          // Do not leave someone on an empty Video tab when everything they
          // have made is a picture.
          const shown: Kind = counts[genKind] === 0 && counts[genKind === "video" ? "image" : "video"] > 0
            ? (genKind === "video" ? "image" : "video")
            : genKind;
          const showing = gens.filter((g) => (g.kind === "image") === (shown === "image"));
          const bothKinds = counts.video > 0 && counts.image > 0;
          if (!generationsReady && gens.length === 0) return <LoadingGrid label="Loading your generations…" />;
          if (gens.length === 0) {
            return (
              <EmptyState
                className="mt-8"
                icon={<Clapperboard size={22} />}
                title="No generations yet"
                hint="Generate a video and it'll show up here."
                action={{ label: "Generate a video", href: "/generate" }}
              />
            );
          }
          return (
            <>
              {bothKinds && (
                <div className="mt-6">
                  <KindSwitch value={shown} onChange={setGenKind} counts={counts} />
                </div>
              )}
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {showing.map((g) => (
                  <VideoThumb key={g.id} g={g} onOpen={openRecord} />
                ))}
              </div>
            </>
          );
        })()}

        {/* UPLOADED: images, video and audio the customer put here. One grid,
            because they are organised the same way - folders, names, favourites -
            and a model picks from them by kind when it is time to generate. */}
        {tab === "uploaded" && (
          <>
            {/* hidden file input for uploads. Demo mode has nowhere to put a
                video, so it keeps to images. */}
            <input
              ref={uploadRef}
              type="file"
              accept={uploadPortrait ? "image/*" : BACKEND_ENABLED ? "image/*,video/*,audio/*" : "image/*"}
              multiple
              className="hidden"
              onChange={onUploadFiles}
            />

            {/* What is here, and what keeping it costs at the backend's rate. */}
            {BACKEND_ENABLED && uploads.length > 0 && (
              <p className="mt-4 text-sm text-muted">
                {counts.image} image{counts.image === 1 ? "" : "s"} · {counts.video} video · {counts.audio} audio ·{" "}
                {(storedBytes / 1048576).toFixed(1)} MB
                {storageRate !== null && <> · {money((storedBytes / 1024 ** 3) * storageRate)} a month to keep</>}
              </p>
            )}

            {/* search, matches by name across all images (results show their folder) */}
            <div className="lib-search relative mt-6 max-w-md">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={imgQuery}
                onChange={(e) => setImgQuery(e.target.value)}
                placeholder="Search uploads by name"
                className="w-full rounded-none border border-line-strong bg-raised py-2.5 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
              />
            </div>

            {/* toolbar row: folder tabs (left) on the same line as the actions (right) */}
            <div className="lib-toolbar mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
              {/* left: All + folder tabs (drop targets) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`rounded-none border px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                    activeFolder === null ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  All ({uploads.length})
                </button>
                {/* Favorites pseudo-folder, appears once any image is hearted */}
                {favCount > 0 && (
                  <button
                    onClick={() => setActiveFolder("favorites")}
                    className={`flex items-center gap-1.5 rounded-none border px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                      activeFolder === "favorites" ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
                    }`}
                  >
                    <Heart size={12} fill="currentColor" />
                    Favorites ({favCount})
                  </button>
                )}
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
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : activeFolder === f.id
                          ? "border-accent text-accent-ink"
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
                      disabled={selectedImages === 0}
                      title={
                        selectedImages === 0
                          ? "Only an image can start a generation; choose clips and sound on the Generate page"
                          : undefined
                      }
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
                    <button onClick={() => startUpload()} className="rounded-none bg-accent px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover">
                      Upload {activeFolderObj ? "to folder" : BACKEND_ENABLED ? "files" : "images"}
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
                      <button onClick={() => setCreatingFolder(true)} className="rounded-none border border-hairline-strong px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg transition-colors hover:border-accent hover:text-accent-ink">
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

            {/* sort dropdown (right, below the actions) */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <label htmlFor="img-sort" className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-dim">Sort</label>
              <select
                id="img-sort"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="pg-select rounded-none border border-accent bg-accent-soft px-3 py-2 font-[family-name:var(--font-jetbrains)] text-xs text-accent-ink outline-none"
              >
                <option value="custom">Custom order</option>
                <option value="name">Name A–Z</option>
                <option value="recent">Recently uploaded</option>
                <option value="size">Size</option>
                <option value="uses">Most used</option>
              </select>
            </div>

            {folders.length === 0 && !creatingFolder && (
              <p className="mt-2 text-xs text-dim">Tip: create a folder, then drag files onto it (or right-click one) to organize them. Right-click to rename. Drag one file onto another to reorder (custom).</p>
            )}
            {searching && (
              <p className="mt-2 text-xs text-dim">{shownImages.length} result{shownImages.length === 1 ? "" : "s"} for “{imgQuery}”.</p>
            )}


            {/* image grid */}
            {!libraryReady && uploads.length === 0 ? (
              <LoadingGrid label="Loading your files…" />
            ) : (
            <div className="lib-grid mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {shownImages.length === 0 ? (
                <div className="col-span-full">
                  {searching ? (
                    <EmptyState
                      icon={<Search size={22} />}
                      title={`Nothing matches “${imgQuery}”`}
                      hint="Try a different search."
                    />
                  ) : activeFolderObj ? (
                    <EmptyState
                      icon={<FolderOpen size={22} />}
                      title="This folder is empty"
                      hint="Drag files here, or upload into it."
                      action={{ label: "Upload files", onClick: () => startUpload() }}
                    />
                  ) : (
                    <EmptyState
                      icon={<ImageIcon size={22} />}
                      title="Nothing here yet"
                      hint={
                        BACKEND_ENABLED
                          ? "Upload images to start a video from, or clips and sound for a model to follow."
                          : "Upload images to use them across your models."
                      }
                      action={{ label: BACKEND_ENABLED ? "Upload files" : "Upload images", onClick: () => startUpload() }}
                    />
                  )}
                </div>
              ) : (
                shownImages.map((img) => {
                  const on = selected.has(img.id);
                  return (
                    <div
                      key={img.id}
                      draggable={!selectMode}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", img.id); e.dataTransfer.effectAllowed = "copy"; }}
                      onDragOver={(e) => { if (!selectMode) { e.preventDefault(); setDragOverImg(img.id); } }}
                      onDragLeave={() => setDragOverImg((d) => (d === img.id ? null : d))}
                      onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) reorderImage(id, img.id); setDragOverImg(null); }}
                      onClick={() => { if (selectMode) toggleOne(img.id); else openItem(img); }}
                      onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, id: img.id }); }}
                      title={`${img.name} · click to open, right-click to rename or file it`}
                      className={`group block border p-2 text-left transition-colors ${
                        dragOverImg === img.id ? "border-accent ring-2 ring-accent" : on ? "border-accent" : "border-line"
                      } ${selectMode ? "cursor-pointer" : "cursor-zoom-in"}`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black">
                        <UploadPreview item={img} dimmed={on} />
                        {/* search results: show which folder the image lives in */}
                        {searching && folderNameFor(img.id) && (
                          <span className="absolute left-1.5 top-1.5 flex max-w-[90%] items-center gap-1 truncate rounded-[6px] bg-black/70 px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] text-white">
                            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 4.5 A1 1 0 0 1 2.5 3.5 H6 L7.5 5 H13.5 A1 1 0 0 1 14.5 6 V12 A1 1 0 0 1 13.5 13 H2.5 A1 1 0 0 1 1.5 12 Z" stroke="currentColor" strokeWidth="1.4" /></svg>
                            {folderNameFor(img.id)}
                          </span>
                        )}
                        {img.character && (
                          <span
                            title={
                              img.character.status === "ready"
                                ? "Registered with the video provider as a portrait"
                                : img.character.status === "failed"
                                  ? img.character.error?.message || "The provider would not accept this as a portrait"
                                  : "Being prepared as a portrait — usually a few minutes"
                            }
                            className={`absolute bottom-1.5 left-1.5 rounded-[5px] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.04em] ${
                              img.character.status === "ready"
                                ? "bg-accent/90 text-ink"
                                : img.character.status === "failed"
                                  ? "bg-danger/90 text-ink"
                                  : "bg-blue/90 text-ink"
                            }`}
                          >
                            {img.character.status === "ready"
                              ? "portrait"
                              : img.character.status === "failed"
                                ? "portrait refused"
                                : "preparing"}
                          </span>
                        )}
                        {selectMode ? (
                          <span
                            className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-ink transition-colors ${
                              on ? "border-accent bg-accent" : "border-white/70 bg-black/40"
                            }`}
                          >
                            {on && (
                              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 L5 9 L9.5 3.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </span>
                        ) : (
                          // heart toggle (top-right); always visible if hearted, else on hover
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleImgFav(img.id); }}
                            aria-label={img.fav ? "Remove from favorites" : "Add to favorites"}
                            title={img.fav ? "Unfavorite" : "Favorite"}
                            className={`hit absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-opacity hover:bg-black/70 ${
                              img.fav ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Heart size={13} fill={img.fav ? "var(--c-heart)" : "none"} color={img.fav ? "var(--c-heart)" : "var(--c-heart-idle)"} />
                          </button>
                        )}
                      </div>
                      <p className="mt-2 truncate font-[family-name:var(--font-jetbrains)] text-[10px] text-dim" title={img.name}>{img.name}</p>
                      {describeUpload(img) && (
                        <p className="truncate font-[family-name:var(--font-jetbrains)] text-[10px] text-dim/70">{describeUpload(img)}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            )}
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
            {!selectMode && (
              <button
                onClick={() => {
                  const item = uploads.find((u) => u.id === ctx.id);
                  setCtx(null);
                  if (item) setRenaming({ id: item.id, name: item.name, target: "upload" });
                }}
                className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover"
              >
                Rename
              </button>
            )}
            {!selectMode && activeFolderObj && (
              <button onClick={() => { removeFromFolder(activeFolderObj.id, ctx.id); setCtx(null); }} className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover">Remove from “{activeFolderObj.name}”</button>
            )}
            {!selectMode && folders.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.08em] text-dim">{BACKEND_ENABLED ? "Move to folder" : "Add to folder"}</p>
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
            <button
              onClick={() => {
                const folder = folders.find((f) => f.id === folderCtx.id);
                setFolderCtx(null);
                if (folder) setRenaming({ id: folder.id, name: folder.name, target: "folder" });
              }}
              className="block w-full rounded-[7px] px-3 py-2 text-left text-fg transition-colors hover:bg-hover"
            >
              Rename folder
            </button>
            <button onClick={() => { const id = folderCtx.id; setFolderCtx(null); setDeleteFolderId(id); }} className="mt-1 block w-full rounded-[7px] border-t border-line px-3 py-2 text-left text-danger transition-colors hover:bg-[rgba(255,107,107,0.1)]">Delete folder</button>
          </div>
        </>
      )}

      {/* Expanded image viewer */}
      {imgLightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-8" onClick={closeItem}>
          <button
            type="button"
            onClick={closeItem}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-black/50 text-white transition-colors hover:bg-danger"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-4xl flex-col items-center gap-3">
            {imgLightbox.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgLightbox.url} alt={imgLightbox.name} className="max-h-[80vh] max-w-full object-contain" />
            ) : imgLightbox.kind === "video" ? (
              <video src={imgLightbox.url} controls autoPlay playsInline className="max-h-[80vh] max-w-full bg-black object-contain" />
            ) : (
              <div className="w-full max-w-lg border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <Music size={22} className="text-gold" />
                  <p className="truncate text-sm text-fg">{imgLightbox.name}</p>
                </div>
                <audio src={imgLightbox.url} controls autoPlay className="mt-4 w-full" />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/70">
              <span>
                {imgLightbox.name}
                {describeUpload(imgLightbox) ? ` · ${describeUpload(imgLightbox)}` : ""}
              </span>
              {/* Right-click is not available on a touch screen, so renaming is
                  reachable from here too. */}
              <button
                type="button"
                onClick={() => {
                  const item = imgLightbox;
                  closeItem();
                  setRenaming({ id: item.id, name: item.name, target: "upload" });
                }}
                className="rounded-none border border-white/40 px-2 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-white transition-colors hover:border-white hover:bg-white/10"
              >
                Rename
              </button>
              {/* Changing your mind about a portrait. Without this the only fix
                  for picking the wrong option at upload is uploading again. */}
              {BACKEND_ENABLED && imgLightbox.kind === "image" && (
                <PortraitToggle
                  item={imgLightbox}
                  onDone={() => {
                    setUploads(getUploads());
                    closeItem();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* What is being added. Asked before the file picker rather than after,
          because the answer decides whether the file is also registered with
          the video provider - which costs a slot of a bought allowance, takes
          minutes to settle, and is not undone by deleting the upload. */}
      {askingUpload && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAskingUpload(false)}
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-line bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
              Upload files
            </h3>
            <p className="mt-1 text-xs text-dim">What are you adding?</p>

            <div className="mt-4 space-y-2">
              {(
                [
                  [false, "Files", "Images, video or audio. Use them as reference material in any model."],
                  [
                    true,
                    "Portraits",
                    "Characters you will reuse. Registered with the video provider, so the same face comes out the same way each time — and so a likeness gets past their review.",
                  ],
                ] as const
              ).map(([value, title, note]) => {
                const on = uploadPortrait === value;
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setUploadPortrait(value);
                      setConsented(false);
                    }}
                    className={`block w-full rounded-none border p-3 text-left transition-colors ${
                      on ? "border-accent bg-accent-soft" : "border-line hover:border-blue"
                    }`}
                  >
                    <span className={`block text-sm ${on ? "text-accent-ink" : "text-fg"}`}>{title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{note}</span>
                  </button>
                );
              })}
            </div>

            {uploadPortrait && (
              <>
                {/* One assertion, covering both cases. Whether the face is
                    invented or real is not a question we ask any more - the
                    provider has one library either way - but having the right
                    to use it is a question that still matters. */}
                <label className="mt-3 flex items-start gap-2 text-xs leading-snug text-muted">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I have the right to use this likeness. If it is a real person, they have agreed to appear
                    in videos I generate and I can show that if asked.
                  </span>
                </label>
                <p className="mt-3 border-l-2 border-line pl-3 text-xs leading-snug text-dim">
                  Images only. Preparing one takes a few minutes and uses one slot of your provider
                  allowance. You can change this later from the library.
                </p>
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAskingUpload(false)}
                className="rounded-none border border-line-strong px-3 py-1.5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-muted transition-colors hover:bg-hover hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={chooseFiles}
                className="rounded-none bg-accent px-4 py-1.5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover"
              >
                Choose files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A file that made a video: say so before it goes */}
      {usedWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setUsedWarning(null)}>
          <div className="w-full max-w-md rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Used to make a video</h3>
            <p className="mt-2 text-sm text-muted">{usedWarning.message}</p>
            <p className="mt-2 text-xs text-dim">
              Those videos keep playing — each is its own copy. What is lost is the ability to generate them again from
              this file.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setUsedWarning(null)} className="rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Keep it</button>
              <button
                onClick={() => deleteImages(usedWarning.ids, true)}
                className="rounded-none bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover"
              >
                Delete anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One generated video: what it is, what made it, and what to do next */}
      {record && (
        <GenerationRecordPanel
          key={record.id}
          generation={record}
          onClose={closeRecord}
          onDeleted={(id) => setGens((prev) => prev.filter((g) => g.id !== id))}
        />
      )}

      {/* Rename an upload */}
      {renaming && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setRenaming(null)}>
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
              Rename {renaming.target === "folder" ? "folder" : "file"}
            </h3>
            <input
              autoFocus
              value={renaming.name}
              onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); }}
              className="mt-4 w-full rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none focus:border-blue"
            />
            <p className="mt-2 text-xs text-dim">
              {renaming.target === "folder" ? "Nothing inside the folder moves." : "The name is yours; the file itself is untouched."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRenaming(null)} className="rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Cancel</button>
              <button onClick={commitRename} className="rounded-none bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-hover">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteIds && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => setDeleteIds(null)}>
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Delete {deleteIds.length} file{deleteIds.length === 1 ? "" : "s"}?</h3>
            <p className="mt-2 text-sm text-muted">This can&apos;t be undone. The file{deleteIds.length === 1 ? "" : "s"} will be removed from your library and any folders, and stop costing storage.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteIds(null)} className="rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Cancel</button>
              <button onClick={() => deleteImages(deleteIds)} className="rounded-none bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover">Delete</button>
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
              <button onClick={() => setDeleteFolderId(null)} className="rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover">Cancel</button>
              <button onClick={() => { deleteFolder(deleteFolderId); setDeleteFolderId(null); }} className="rounded-none bg-danger px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-danger-hover">Delete folder</button>
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
                    modelFilter === f ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent-ink">
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

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LibraryInner />
    </Suspense>
  );
}
