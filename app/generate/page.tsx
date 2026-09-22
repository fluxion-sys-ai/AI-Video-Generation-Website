"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useLive } from "@/lib/live";
import { Heart, GripHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { ApiDocs } from "@/components/docs/api-docs";
import { SiteFooter } from "@/components/site/site-footer";
import { getModels, getModel, getModelsOfKind, type Model, refreshCatalog } from "@/lib/models";
import { isSignedIn, saveDraft, loadDraft, clearDraft } from "@/lib/auth";
import { NumberField, isPositive } from "@/components/ui/number-field";
import { addRecent, takePendingImages, takePendingRequest, addLibraryImages, isFavorite, toggleFavorite, uploadLibraryImage } from "@/lib/prefs";
import { BACKEND_ENABLED, checkReferences, listLibrary, type LibraryItem } from "@/lib/hub";
import { ReferenceMedia, LibraryImagePicker, IMAGE_ACCEPT } from "@/components/generate/reference-media";
import { costBreakdown, estimateTokens, money, ratesFor, useRateCard } from "@/lib/rate-card";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useSkin } from "@/lib/use-skin";
import { PreviewBadge } from "@/components/models/preview-badge";
import { KindSwitch } from "@/components/ui/kind-switch";
import { generateImage, generateVideo, refineImage, refineVideo } from "@/lib/api";
import { hasPaymentMethod } from "@/lib/billing";
import { addGeneration } from "@/lib/generations";
import { toast } from "@/lib/toast";

type Status = "idle" | "generating" | "complete" | "failed";

type Draft = {
  slug: string;
  aspect: string;
  resolution: string;
  duration: number;
  audio: boolean;
  prompt: string;
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label className="font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.06em] text-fg-soft">{label}</label>
        {hint && <span className="text-xs text-dim">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// form controls use the body theme font (Geist), not the browser default.
// Solid, higher-contrast borders + inner surface so inputs read clearly.
const selectClass =
  "w-full rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue";

// content-width dropdown for short values (aspect ratio, resolution, duration).
// Square corners + custom caret via `pg-select` (see app/globals.css).
const compactSelect =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue pg-select";
// same look but for a plain <input> (no dropdown caret / appearance:none)
const compactInput =
  "rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg font-[family-name:var(--font-geist-sans)] outline-none focus:border-blue focus:ring-1 focus:ring-blue";

// common use for each aspect ratio, shown in the dropdown
const ASPECT_USE: Record<string, string> = {
  "16:9": "YouTube",
  "9:16": "Reels / TikTok",
  "1:1": "Instagram post",
  "4:3": "Camera",
  "3:4": "Instagram portrait",
  "21:9": "Cinema",
};

function GenerateInner() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const router = useRouter();
  const params = useSearchParams();
  // No ?model → the first model the catalogue offers. There used to be a saved
  // default in Settings; every route into this page names a model, so it was a
  // setting nobody reached.
  const catalogue = getModels();
  const slug = params.get("model") || catalogue[0]?.slug || "";
  // Undefined until the catalogue arrives, or when a link names a model that no
  // longer exists; the screen holds back rather than inventing one.
  const model: Model | undefined = getModel(slug) ?? catalogue[0];
  // Video or image. This is the one field that changes the shape of the screen
  // rather than its contents: an image has no length, no sound and no aspect
  // ratio of its own, so those controls do not exist for one rather than
  // sitting there disabled.
  const kind: "video" | "image" = model?.modality ?? "video";
  const isImage = kind === "image";
  // Both switches are offered only when there is somewhere to switch to. Image
  // models are invitation-based, so for most accounts there is not.
  const videoModels = catalogue.filter((m) => m.modality !== "image");
  const imageModels = getModelsOfKind("image");
  const bothKinds = videoModels.length > 0 && imageModels.length > 0;
  // The model's own usual one. This used to consult a saved default, which was
  // one number applied to models that do not sell the same values - and to
  // image models, which sell sizes rather than resolutions at all.
  const preferredRes = () => {
    if (!model) return "";
    return model.popularResolutions[0] || model.resolutions[0];
  };

  // Generation needs an account, so the screen that configures it does too:
  // every model link in the site leads here, which makes this the one gate.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const ok = isSignedIn();
    // Reading the session is a browser-only fact, so it has to land in state
    // from an effect; the page renders nothing until it does.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignedIn(ok);
    if (!ok) router.replace(`/login?next=${encodeURIComponent(`/generate?model=${slug}`)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const [aspect, setAspect] = useState(model?.aspectRatios[0] ?? "16:9");
  const [resolution, setResolution] = useState(preferredRes);
  const [duration, setDuration] = useState<number | null>(model?.durations[0] ?? null);
  const [audio, setAudio] = useState(false);
  const [prompt, setPrompt] = useState("");
  // Uploaded reference images (multiple). Each holds an object URL for the
  // thumbnail preview + the file name. Mock only, nothing is sent anywhere.
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  // Ref mirror so the unmount cleanup can revoke every object URL.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((im) => URL.revokeObjectURL(im.url)), []);

  // Reference material: clips and sound the model follows. What the model takes
  // and what each file must satisfy comes from its catalogue row; the verdict on
  // a particular selection comes from the backend, which is the same check it
  // runs when the generation is submitted.
  const [pickingImage, setPickingImage] = useState(false);
  const [refVideos, setRefVideos] = useState<LibraryItem[]>([]);
  const [refAudios, setRefAudios] = useState<LibraryItem[]>([]);
  // Stills the model should follow throughout - a subject, a style, a place -
  // as opposed to the single image below, which is the clip's first frame. The
  // provider treats the two as different modes, which is why they are separate
  // here and why choosing one closes the other off.
  const [refImages, setRefImages] = useState<LibraryItem[]>([]);
  const [refVerdict, setRefVerdict] = useState<{ problems: string[]; facts: { input_video_seconds: number; input_images: number } | null }>({
    problems: [],
    facts: null,
  });
  const { card } = useRateCard();
  const rules = model?.reference;
  const hasReference = refVideos.length > 0 || refAudios.length > 0 || refImages.length > 0;
  // H3 treats reference material and frame images as two different modes and
  // refuses a request that mixes them, so the form does not offer the mix.
  const exclusive = Boolean(rules?.mutually_exclusive_with_frames);
  // Where a model takes reference images, they are the image control. A first
  // frame is a different thing - the output opens on that exact picture - and
  // the provider treats it as a separate mode, so offering both side by side
  // read as two boxes for one job. The API still accepts first_frame; the
  // playground does not ask for it.
  const takesReferenceImages = Boolean(rules?.image);
  // Some deployments cannot generate from a prompt alone: one process serves
  // one task, and a reference-to-video server has nothing to do without an
  // image or a clip. The catalogue row says so (supports.reference.min_visual),
  // and saying it here - before the button is pressed - is the difference
  // between a form that guides and a request that gets refused.
  const needsReference = Number(rules?.min_visual || 0) > 0;
  const framesBlocked = exclusive && hasReference;
  const referenceBlocked = exclusive && images.length > 0;
  // A first frame counts as something to follow where the model takes one; on a
  // reference-only deployment it is not offered at all.
  const visualCount = refVideos.length + refImages.length + (framesBlocked ? 0 : images.length);
  const missingReference = needsReference && visualCount < Number(rules?.min_visual || 0);
  // With nothing selected there is nothing to judge, so the verdict is derived
  // rather than cleared: the effect below only writes when an answer arrives.
  const refProblems = hasReference ? refVerdict.problems : [];
  const refFacts = hasReference ? refVerdict.facts : null;

  useEffect(() => {
    if (!BACKEND_ENABLED || !model || !hasReference) return;
    let alive = true;
    checkReferences(
      {
        model: model.slug,
        reference_video: refVideos.map((i) => i.id),
        reference_audio: refAudios.map((i) => i.id),
        reference_image: refImages.map((i) => i.id),
      },
      true,
    )
      .then((result) => {
        if (alive) setRefVerdict({ problems: [], facts: { input_video_seconds: result.facts.input_video_seconds, input_images: result.facts.input_images } });
      })
      .catch((err) => {
        if (!alive) return;
        setRefVerdict({
          problems: err instanceof Error && err.message ? err.message.split("; ") : ["Those files cannot be used here."],
          facts: null,
        });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.slug, refVideos, refAudios, refImages]);

  function addImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (BACKEND_ENABLED) {
      // Store each image once in the library; generation then hands the provider
      // a link instead of re-uploading the bytes.
      void Promise.all(
        files.map(async (f) => {
          try {
            const saved = await uploadLibraryImage(f, { name: f.name, model: slug });
            setImages((prev) => [...prev, { url: saved.url, name: saved.name }]);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not upload that image.");
          }
        }),
      );
      e.target.value = "";
      return;
    }
    // Read as data URLs so the upload also persists into the library (tagged
    // with this model) and shows up under /library.
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        setImages((prev) => [...prev, { url: src, name: f.name }]);
        addLibraryImages([{ id: `u${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src, name: f.name, model: slug, size: f.size, uses: 0, addedAt: Date.now() }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = ""; // let the same file be picked again later
  }
  function removeImage(idx: number) {
    setImages((prev) => {
      const t = prev[idx];
      if (t) URL.revokeObjectURL(t.url);
      return prev.filter((_, i) => i !== idx);
    });
  }
  // Expanded image viewer (click a thumbnail to open, × / Esc to close).
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);
  useEscapeKey(() => setLightbox(null));

  // Favorite (heart) for the current model, shared with the model catalog.
  const [fav, setFav] = useState(false);
  useEffect(() => setFav(isFavorite(slug)), [slug]);

  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  // Why the last attempt failed, kept until the next one starts.
  const [failure, setFailure] = useState("");
  const [tab, setTab] = useState<"examples" | "change">("examples");
  const [view, setView] = useState<"playground" | "examples" | "api">("playground");
  const skin = useSkin();
  const [panelOpen, setPanelOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  // Bumped on every run/reset so a stale in-flight generation can't overwrite
  // state after the user has moved on (replaces the old setTimeout handle).
  const genId = useRef(0);

  // Refine session: appears automatically after the first generation.
  const [session, setSession] = useState(false);
  const [refineInput, setRefineInput] = useState("");

  // Draggable floating refine bar: offset (px) from its default bottom-center
  // spot. Drag the header grip to move it out of the way.
  const [refinePos, setRefinePos] = useState({ x: 0, y: 0 });
  const refineDrag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    function move(e: PointerEvent) {
      const d = refineDrag.current;
      if (!d) return;
      e.preventDefault();
      setRefinePos({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
    }
    function up() { refineDrag.current = null; }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  function startRefineDrag(e: React.PointerEvent) {
    // Don't start a drag when pressing the header buttons (Undo/Restart).
    if ((e.target as HTMLElement).closest("button")) return;
    refineDrag.current = { sx: e.clientX, sy: e.clientY, ox: refinePos.x, oy: refinePos.y };
  }

  // What the configured generation will cost, split into the things being
  // charged for: the output, the reference video by its own length, and input
  // images past the free allowance. Every rate comes from the hub's rate card.
  const estimate = (() => {
    if (!model) return null;
    const freeImages = rules?.frame_image?.free_count ?? rules?.image?.free_count ?? 0;
    // An image is one price per call, not an expression over what was asked
    // for, so there is no rate card to consult: the figure is on the model.
    // The second term is the one the hub cannot bill and the backend settles
    // itself (sidecar/app/images.py), and it is quoted here for the same
    // reason the reference-video term is - the price moves when you add a
    // file, and a customer should see that before pressing the button.
    if (isImage) {
      if (model.usdPerImage === undefined) return null;
      const each = rules?.image?.usd_each ?? 0;
      const billable = Math.max(0, refImages.length - freeImages);
      const parts = [`${money(model.usdPerImage)} for one ${resolution} image`];
      if (billable > 0) {
        parts.push(
          `${money(billable * each)} for ${billable} input image${billable === 1 ? "" : "s"} past the first ${freeImages}`,
        );
      }
      return { total: model.usdPerImage + billable * each, parts, reserves: false };
    }
    if (!isPositive(duration)) return null;
    // Every reference still is an input image, and so is the first frame - of
    // which only the first is sent (lib/api.ts). The two never appear together.
    const inputImages = refImages.length || (framesBlocked || images.length === 0 ? 0 : 1);
    const facts = {
      seconds: duration,
      resolution,
      // Some providers bill by pixels rather than by seconds, so the aspect
      // ratio is part of the price. Computed with the same arithmetic the
      // plugin uses, so this quotes the charge rather than guessing at it;
      // models priced per second ignore it.
      tokens: estimateTokens(resolution, aspect, duration),
      // Some providers charge two rates for the same model and pick between
      // them on whether a video is among the inputs. Counter-intuitively the
      // rate with one is the cheaper, so this is not cosmetic: the quote moves
      // when a reference clip is added or removed.
      video_input: refVideos.length > 0 ? "yes" : "no",
      input_video_seconds: refFacts?.input_video_seconds ?? 0,
      input_images: inputImages,
      input_images_billable: Math.max(0, inputImages - freeImages),
      input_audios: refAudios.length,
    };
    const broken = costBreakdown(ratesFor(card, model), facts);
    if (!broken) return null;
    const labels: Record<string, (units: number) => string> = {
      seconds: (units) => `${units}s at ${resolution}`,
      // Say the shape too: at one resolution a 21:9 clip costs 2.3x a square
      // one, and a price that moves when you change the ratio is confusing
      // until you are told why.
      tokens: (units) => `${duration}s at ${resolution} ${aspect} (${units.toLocaleString()} tokens)`,
      input_video_seconds: (units) => `${Number(units.toFixed(2))}s of reference video`,
      input_images_billable: (units) => `${units} image${units === 1 ? "" : "s"} past the first ${freeImages}`,
    };
    return {
      total: broken.total,
      parts: broken.lines.map((line) => `${money(line.usd)} for ${(labels[line.field] || ((u: number) => `${u} ${line.field}`))(line.units)}`),
      reserves: facts.input_video_seconds > 0,
    };
  })();

  // Reset model-dependent options when the selected model changes.
  // Track recently-used models for the dashboard.
  useEffect(() => {
    addRecent(slug);
  }, [slug]);

  // Keep the prompt, but drop any generated video / refine session.
  //
  // Keyed on the model object, not the slug in the URL: with a backend the
  // catalogue arrives after the first render, so a page opened at
  // ?model=pulse has the same slug throughout while the model itself goes from
  // undefined to real. Keying on the slug left these options unset.
  useEffect(() => {
    if (!model) return;
    // An image model has neither, and both have to be cleared rather than
    // left over from the video that was open a moment ago.
    setAspect(model.aspectRatios[0] ?? "");
    setResolution(preferredRes());
    setDuration(model.durations[0] ?? null);
    // Sound follows the model rather than the last one looked at: where it is a
    // switch the provider leaves on (Seedance), the form should open the way a
    // request with no `audio` field would be served, or the playground and the
    // API quietly disagree about what "default" means.
    setAudio(model.supports.audio);
    setRefVideos([]);
    setRefAudios([]);
    setRefImages([]);
    setStatus("idle");
    setResultUrl(null);
    setSession(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.slug]);

  // Pick up images handed off from the library ("upload to this model"), if any.
  // Runs per model so it works whether the page mounts fresh or just re-routes.
  useEffect(() => {
    const pending = takePendingImages();
    if (!pending.length) return;
    if (!takesReferenceImages) {
      setImages(pending);
      return;
    }
    // This model follows reference images rather than opening on a still, so
    // the files are selected as references - which needs the stored item, not
    // just its URL.
    let alive = true;
    const wanted = new Set(pending.map((i) => i.id).filter(Boolean) as string[]);
    if (!wanted.size) return;
    void (async () => {
      const listing = await listLibrary("image").catch(() => null);
      if (!alive) return;
      const picked = (listing?.items || []).filter((i) => wanted.has(i.id));
      if (picked.length) setRefImages(picked);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, takesReferenceImages]);

  /**
   * Reopen a past generation, handed over by its record in the library.
   *
   * There is one way to run something again, and it goes through this form:
   * the prompt, the settings and the same files come back, and nothing is
   * spent until Generate is pressed, so an edit first is free. The links the
   * request carried have long expired, so the files are looked up by id and
   * re-selected exactly as the pickers would - and one that has since been
   * deleted is named rather than quietly dropped.
   *
   * Keyed on the model, not the slug: the reset effect above fires when the
   * catalogue lands, and this has to run after it or its values get wiped.
   */
  useEffect(() => {
    if (!model) return;
    const pending = takePendingRequest();
    if (!pending) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    const request = pending.request as Record<string, unknown>;
    if (typeof request.prompt === "string") setPrompt(request.prompt);
    const seconds = Number(request.seconds ?? request.duration);
    if (Number.isFinite(seconds) && seconds > 0) setDuration(seconds);
    // A video's resolution ("720p") and an image's size ("2048x1152") are the
    // same control here, and a request carries one or the other.
    const res = request.resolution ?? request.size;
    if (typeof res === "string" && model.resolutions.includes(res)) setResolution(res);
    const ratio = request.aspect_ratio ?? request.ratio;
    if (typeof ratio === "string" && model.aspectRatios.includes(ratio)) setAspect(ratio);
    if (typeof request.audio === "boolean" && model.supports.audio) setAudio(request.audio);
    toast("Copied from your library. Change anything, then Generate.");

    /* eslint-enable react-hooks/set-state-in-effect */
    const wanted = pending.inputs.filter((i) => i.item_id);
    if (!wanted.length) return;
    let alive = true;
    void (async () => {
      const listing = await listLibrary().catch(() => null);
      if (!alive) return;
      const byId = new Map((listing?.items || []).map((i) => [i.id, i]));
      const videos: LibraryItem[] = [];
      const audios: LibraryItem[] = [];
      const stills: LibraryItem[] = [];
      const frames: { url: string; name: string }[] = [];
      const gone: string[] = [];
      const reframed: string[] = [];
      for (const input of wanted) {
        const item = byId.get(input.item_id as string);
        if (!item) {
          gone.push(input.name || input.role);
          continue;
        }
        // The role decides where it goes, not the file: the same still is a
        // first frame in one request and a reference in another, and the two
        // are different modes the provider refuses to mix.
        if (item.kind === "video") videos.push(item);
        else if (item.kind === "audio") audios.push(item);
        else if (input.role === "reference image" || takesReferenceImages) {
          // A frame image from an older request lands here, because this
          // playground no longer pins frames - the toast below says so rather
          // than letting the request come back quietly changed.
          if (input.role !== "reference image") reframed.push(input.name || "an image");
          stills.push(item);
        } else frames.push({ url: item.url, name: item.name });
      }
      setRefVideos(videos);
      setRefAudios(audios);
      setRefImages(stills);
      if (frames.length) setImages(frames);
      if (reframed.length) {
        toast(
          `${reframed.join(", ")} was the first frame of that generation. It is here as a reference image, which guides the shot rather than starting it.`,
        );
      }
      if (gone.length) {
        toast(
          gone.length === 1
            ? `${gone[0]} is no longer in your library, so it was left out.`
            : `${gone.join(", ")} are no longer in your library, so they were left out.`,
        );
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model?.slug]);

  // Restore a saved draft after a sign-in detour, then clear it.
  useEffect(() => {
    const d = loadDraft<Draft>();
    if (d && d.slug === slug) {
      setAspect(d.aspect);
      setResolution(d.resolution);
      setDuration(d.duration);
      setAudio(d.audio);
      setPrompt(d.prompt);
      clearDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ignore any in-flight generation once the component unmounts.
  useEffect(() => () => { genId.current++; }, []);

  /**
   * Back to an empty form, for something unrelated. The finished video is not
   * lost by this - it is in the library - so nothing here asks twice.
   */
  function startOver() {
    genId.current++;
    setPrompt("");
    setRefineInput("");
    setImages([]);
    setRefVideos([]);
    setRefAudios([]);
    setRefImages([]);
    setResultUrl(null);
    setStatus("idle");
    setSession(false);
    if (model) {
      setAspect(model.aspectRatios[0] ?? "");
      setResolution(preferredRes());
      setDuration(model.durations[0] ?? null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function draft(): Draft {
    return { slug, aspect, resolution, duration: duration ?? model?.durations[0] ?? 0, audio, prompt };
  }

  function onGenerate() {
    // Gate 0: a duration has to be chosen. The field is left empty when it is
    // cleared, rather than refilled, so this is where that is caught. An image
    // has no duration to choose, so the check is narrowed into `seconds`
    // rather than simply coming first - the video call below needs a number.
    const seconds = isPositive(duration) ? duration : null;
    if (!isImage && seconds === null) {
      toast("Enter a duration in seconds.");
      return;
    }
    // Gate 1: must be signed in (save the form so sign-in doesn't lose it).
    if (!isSignedIn()) {
      saveDraft(draft());
      router.push(`/login?next=${encodeURIComponent(`/generate?model=${slug}`)}`);
      return;
    }
    // Gate 2: must be able to pay. With a backend that means holding credit;
    // in the demo it means a saved card. The hub enforces this server-side too.
    if (!hasPaymentMethod()) {
      // Billing explains where credit comes from, which differs while payments
      // are closed, so the toast stays neutral and the page does the talking.
      toast(BACKEND_ENABLED ? "You are out of credit." : "Add a payment method to start generating.");
      router.push(BACKEND_ENABLED ? "/profile?tab=billing" : "/profile?tab=payment");
      return;
    }
    const id = ++genId.current;
    setResultUrl(null);
    setFailure("");
    setStatus("generating");
    if (isImage) {
      generateImage({ slug, prompt, size: resolution, referenceImageIds: refImages.map((i) => i.id) })
        .then((r) => {
          if (id !== genId.current) return;
          setResultUrl(r.imageUrl);
          setStatus("complete");
          setSession(true);
        })
        .catch((err) => {
          if (id !== genId.current) return;
          setStatus("failed");
          setFailure(err instanceof Error && err.message ? err.message : "Generation failed.");
        });
      return;
    }
    // Gate 0 already refused this, so it cannot happen; it is here to hand the
    // call a number instead of a maybe, and it undoes the spinner if it ever
    // somehow does.
    if (seconds === null) {
      setStatus("idle");
      return;
    }
    generateVideo({
      slug,
      prompt,
      aspect,
      resolution,
      duration: seconds,
      audio,
      images: framesBlocked ? [] : images.map((i) => i.url),
      referenceVideoIds: refVideos.map((i) => i.id),
      referenceAudioIds: refAudios.map((i) => i.id),
      referenceImageIds: refImages.map((i) => i.id),
    })
      .then((r) => {
        if (id !== genId.current) return; // superseded, drop the result
        setResultUrl(r.videoUrl);
        setStatus("complete");
        setSession(true);
        // Record it so it shows up in the Library + Profile history.
        addGeneration({ slug, prompt, videoUrl: r.videoUrl, poster: model?.poster ?? "" });
      })
      .catch((err) => {
        if (id !== genId.current) return;
        setStatus("failed");
        // The reason belongs where the failure is. A provider's refusal carries
        // its own request id - "the input image may contain real person.
        // Request id: 0217…" - and that is the line somebody needs to copy into
        // a bug report, so it stays on screen until the next attempt instead of
        // going past in a toast.
        setFailure(err instanceof Error && err.message ? err.message : "Generation failed.");
      });
  }

  // Re-generate from the current prompt + all refinements (the latest edits
  // applied on top of the last result).
  /**
   * Re-generate from a prompt, passed in rather than read from state: React has
   * not re-rendered when the handler runs, so reading it here would send the
   * text as it was *before* the edit - which is exactly how refinements used to
   * arrive one behind, each one a full-price generation.
   */
  function regen(withPrompt: string = prompt) {
    const id = ++genId.current;
    setResultUrl(null);
    setFailure("");
    setStatus("generating");
    if (isImage) {
      refineImage({ slug, prompt: withPrompt, size: resolution, referenceImageIds: refImages.map((i) => i.id) }, [])
        .then((r) => {
          if (id !== genId.current) return;
          setResultUrl(r.imageUrl);
          setStatus("complete");
          setSession(true);
        })
        .catch((err) => {
          if (id !== genId.current) return;
          setStatus("failed");
          setFailure(err instanceof Error && err.message ? err.message : "Generation failed.");
        });
      return;
    }
    if (!isPositive(duration)) {
      toast("Enter a duration in seconds.");
      return;
    }
    refineVideo(
      {
        slug,
        prompt: withPrompt,
        aspect,
        resolution,
        duration,
        audio,
        images: framesBlocked ? [] : images.map((i) => i.url),
        referenceVideoIds: refVideos.map((i) => i.id),
        referenceAudioIds: refAudios.map((i) => i.id),
        referenceImageIds: refImages.map((i) => i.id),
      },
      [],
    )
      .then((r) => {
        if (id !== genId.current) return;
        setResultUrl(r.videoUrl);
        setStatus("complete");
        setSession(true);
      })
      .catch((err) => {
        if (id !== genId.current) return;
        setStatus("failed");
        // The reason belongs where the failure is. A provider's refusal carries
        // its own request id - "the input image may contain real person.
        // Request id: 0217…" - and that is the line somebody needs to copy into
        // a bug report, so it stays on screen until the next attempt instead of
        // going past in a toast.
        setFailure(err instanceof Error && err.message ? err.message : "Generation failed.");
      });
  }
  /**
   * An edit becomes part of the prompt, in the box, where it can be read and
   * changed. The prompt is then the only description of what will be made -
   * there is no second list of instructions to fall out of step with it, which
   * is what made refinements arrive one behind.
   */
  function sendRefine() {
    const text = refineInput.trim();
    if (!text) return;
    const next = `${prompt.trim()}\n${text}`.trim();
    setPrompt(next);
    setRefineInput("");
    regen(next);
  }

  // Real download: fetch the result and save it as a file (works for the mock
  // clip, which is same-origin). WebM/GIF aren't produced in this demo.
  async function downloadResult() {
    if (!resultUrl) return;
    const filename = isImage ? "fluxion-image.png" : "fluxion-video.mp4";
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // The provider's image URL is another origin, so fetching it can be
      // refused; the link still saves the file, it just cannot be renamed.
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = filename;
      a.click();
    }
  }

  // The preview's shape. A video gets it from the aspect ratio; an image has
  // no ratio control at all - "2048x1152" *is* the shape - so it is read back
  // out of the size. Either way a nonsense value falls back to 16:9 rather
  // than dividing by zero and collapsing the pane.
  const [aw, ah] = (() => {
    const parts = (isImage ? resolution : aspect || "16:9").split(isImage ? "x" : ":").map(Number);
    const [w, h] = parts;
    return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? [w, h] : [16, 9];
  })();
  const portrait = ah > aw;

  // Hold the screen back until the gate above has decided, so a signed-out
  // visitor never sees the editor flash before the redirect.
  if (signedIn !== true) return <div className="px-6 py-6" />;
  if (!model) {
    return (
      <div className="px-6 py-6 text-sm text-muted">
        {catalogue.length === 0 ? "Loading the catalogue…" : "That model is not available."}
      </div>
    );
  }

  // Safe from here: the screen only renders with a model.
  // Empty for an image model, where Math.min() of nothing is Infinity. The
  // duration control is not rendered for one, and these are only read by it.
  const minDuration = model.durations.length ? Math.min(...model.durations) : 0;
  const maxDuration = model.durations.length ? Math.max(...model.durations) : 0;
  // The nearest length this model actually renders. Clamping to the ends of the
  // range is not enough on its own: a model that sells 5, 10 and 15 would let
  // someone type 7 and then have the provider refuse it after they pressed
  // Generate. MiniMax H3 Fast now sells every second from 5 to 15, so this
  // changes nothing for it - it keeps the promise true for anything that does
  // not.
  const nearestDuration = (typed: number) =>
    model.durations.length
      ? model.durations.reduce((best, value) => (Math.abs(value - typed) < Math.abs(best - typed) ? value : best), model.durations[0])
      : typed;

  return (
    <div className="px-6 py-6">
      {/* Top bar: what to make, which model, and Playground/API - in that
          order, because the first narrows the second. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Video or image. Hidden when the account has only one kind, which is
          most of them: image models are invitation-based. Captioned, and framed
          like the picker beside it, because a bare "Video | Image" next to a
          model name reads as though it might be filtering the models. */}
      {bothKinds && (
        <KindSwitch
          caption="Make"
          value={kind}
          onChange={(k) => {
            const first = (k === "image" ? imageModels : videoModels)[0];
            if (first) router.push(`/generate?model=${first.slug}`);
          }}
        />
      )}
      <div className="pg-modelpick relative w-full max-w-[210px]">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            aria-expanded={pickerOpen}
            className="flex w-full items-center justify-between gap-3 border border-line-strong bg-raised px-3 py-2.5 text-left transition-colors hover:border-blue"
          >
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-[0.08em] text-dim">Model</span>
              <span className="block truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{model.name}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`shrink-0 transition-transform ${pickerOpen ? "rotate-180" : ""}`}>
              <path d="M3 6 L8 11 L13 6" stroke="var(--c-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {pickerOpen && (
            <div className="absolute left-0 right-0 z-30 mt-1 border border-line-strong bg-panel p-2 shadow-xl shadow-black/40">
              <div className="relative">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input
                  autoFocus
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search models"
                  className="w-full border border-line-strong bg-raised py-2 pl-8 pr-2 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
                />
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto">
                {(() => {
                  const q = pickerQuery.trim().toLowerCase();
                  // Only the kind being made. Switching between them is the
                  // control above, which is a different decision from picking
                  // a model - mixing the two lists would make "Seedream" look
                  // like an alternative to "Seedance" for the same job.
                  const same = getModels().filter((m) => (m.modality === "image") === isImage);
                  const list = q
                    ? same.filter((m) => [m.name, m.tagline, m.description, ...m.capabilities].join(" ").toLowerCase().includes(q))
                    : same;
                  if (list.length === 0) return <p className="p-3 text-sm text-dim">No models match &ldquo;{pickerQuery}&rdquo;.</p>;
                  return list.map((m) => (
                    <button
                      key={m.slug}
                      onClick={() => {
                        setPickerOpen(false);
                        setPickerQuery("");
                        router.push(`/generate?model=${m.slug}`);
                      }}
                      className={`flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-hover ${m.slug === slug ? "bg-[rgba(255,138,30,0.08)]" : ""}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[rgba(255,138,30,0.35)] bg-accent-soft font-[family-name:var(--font-jetbrains)] text-xs font-semibold text-accent-ink">
                        {m.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg">{m.name}</span>
                          {/* Unpublished, and visible here only because this
                              account was let in on it. */}
                          {m.preview && <PreviewBadge />}
                        </span>
                        <span className="block truncate text-xs text-dim">{m.tagline}</span>
                      </span>
                      {m.slug === slug && <span className="shrink-0 text-xs text-accent-ink">✓</span>}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
      </div>
      {/* Alt skins: Playground / API tabs live in the top bar beside the picker.
          OG keeps its original left rail (rendered inside the body below). */}
      {skin !== "og" && (
        <nav className="pg-viewnav flex gap-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em]">
          {(skin === "luxury" ? (["playground", "examples", "api"] as const) : (["playground", "api"] as const)).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-none px-3 py-2 text-left transition-colors ${
                view === v ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-fg"
              }`}
            >
              {v === "playground" ? "Playground" : v === "examples" ? "Examples" : "API"}
            </button>
          ))}
        </nav>
      )}
      </div>

      {/* One screen tall when the form is short, taller when it is not. A fixed
          height here used to clip: the form column was meant to scroll inside
          it, but an intermediate div with no height of its own turned h-full
          into auto, so enough reference images pushed Generate straight out of
          the box and over the footer. Growing is the safer default - nothing is
          ever unreachable, and the footer stays below the content. */}
      <div className={`lg:min-h-[calc(100vh-7rem)] ${skin === "og" ? "grid gap-6 lg:grid-cols-[150px_1fr]" : "pg-body"}`}>
      {/* OG: original left-rail Playground / API tabs. */}
      {skin === "og" && (
        <nav className="flex gap-2 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] lg:flex-col lg:gap-1">
          {(["playground", "api"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-none px-3 py-2 text-left transition-colors ${
                view === v ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-fg"
              }`}
            >
              {v === "playground" ? "Playground" : "API"}
            </button>
          ))}
        </nav>
      )}
      <div className="min-w-0">
      {view === "api" ? (
        <div className="min-w-0">
          <ApiDocs model={model} />
        </div>
      ) : view === "examples" ? (
        <div className="min-w-0">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl text-fg-strong">Sample outputs</h2>
            <p className="mt-1 text-sm text-muted">A sample generation from {model.name}.</p>
            <div className="mt-4 overflow-hidden rounded-[10px] bg-black">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={model.poster} alt={`Sample output from ${model.name}`} className="aspect-video w-full object-cover" />
              ) : (
                <video className="aspect-video w-full object-cover" src={model.demoVideo} poster={model.poster} autoPlay muted loop controls playsInline />
              )}
            </div>
          </div>
        </div>
      ) : (
      <div
        className={`pg-grid grid gap-8 transition-[grid-template-columns] duration-300 lg:items-start ${
          panelOpen ? "lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,40%)]" : "lg:grid-cols-[40px_minmax(0,1fr)_minmax(0,40%)]"
        }`}
      >
      {/* Collapsible left panel */}
      <aside className="pg-examples min-h-0">
        {panelOpen ? (
          <div className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto border-r border-line pr-5">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex gap-5 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
                  <button
                    onClick={() => setTab("examples")}
                    className={`pb-1 transition-colors ${tab === "examples" ? "text-gold-soft" : "text-muted hover:text-fg"}`}
                  >
                    Examples
                  </button>
                </div>
                <button onClick={() => setPanelOpen(false)} aria-label="Collapse panel" className="shrink-0 text-muted hover:text-accent-ink">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3 L5 8 L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div>
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={model.poster} alt={`Sample output from ${model.name}`} className="aspect-video w-full rounded-[10px] bg-black object-cover" />
                ) : (
                  <video
                    className="aspect-video w-full rounded-[10px] bg-black object-cover"
                    src={model.demoVideo}
                    poster={model.poster}
                    autoPlay
                    muted
                    loop
                    controls
                    playsInline
                    preload="auto"
                  />
                )}
                <p className="mt-2 text-xs text-dim">Sample output from {model.name}.</p>
              </div>
            </div>
          </div>
        ) : (
          // Chic pull-tab to reopen the Examples panel: a caret arrow above a
          // slim vertical line; both accent on hover.
          <button
            onClick={() => setPanelOpen(true)}
            aria-label="Show examples"
            title="Examples"
            className="group flex h-full flex-col items-center gap-2 pt-1 text-muted transition-colors hover:text-accent-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3 L11 8 L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="h-16 w-px rounded-full bg-line transition-colors group-hover:bg-accent" />
          </button>
        )}
      </aside>

      {/* Main form (borderless, compact) */}
      <main className="pg-form min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">{model.name}</h1>
          <button
            type="button"
            onClick={() => setFav(toggleFavorite(slug))}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            title={fav ? "Remove from favorites" : "Add to favorites"}
            className="shrink-0 text-fg transition-transform hover:scale-110"
          >
            <Heart size={20} strokeWidth={2} fill={fav ? "var(--c-accent)" : "none"} color={fav ? "var(--c-accent)" : "currentColor"} />
          </button>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted">{model.description}</p>

        <div className="mt-5 space-y-4">
          <Field label="Prompt" hint={`${prompt.length} chars`}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={isImage ? "Describe the picture: subject, composition, light, style." : "Describe the shot: subject, motion, camera, lighting."}
              className={`${selectClass} resize-none pg-prompt`}
            />
          </Field>

          {/* Always available: attach/browse reference images (and show any
              handed over from the library), regardless of the model - unless
              reference material is in play, which the provider treats as a
              different mode. */}
          {takesReferenceImages ? null : framesBlocked ? (
            <Field label="Images" hint="not with reference material">
              <p className="text-sm text-muted">
                {model.name} animates either a still you provide or the reference material below, not both.
                Remove the reference files to start from an image.
              </p>
            </Field>
          ) : (
            <Field label="Images" hint="Optional">
              {/* From the disk, or from what is already in the library - a
                  reference image is usually one a customer has used before. */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="flex w-fit cursor-pointer items-center gap-3 rounded-none border border-dashed border-line-strong px-3 py-2 text-sm text-fg-soft hover:border-blue">
                  <span>{images.length === 0 ? "Choose images" : "Add images"}</span>
                  <span className="text-blue">Browse</span>
                  <input type="file" accept={IMAGE_ACCEPT} multiple className="hidden" onChange={addImages} />
                </label>
                {BACKEND_ENABLED && (
                  <button
                    type="button"
                    onClick={() => setPickingImage((open) => !open)}
                    className="rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none transition-colors hover:border-blue hover:text-blue"
                  >
                    {pickingImage ? "Close library" : "From library"}
                  </button>
                )}
              </div>
              {pickingImage && (
                <LibraryImagePicker
                  chosen={images.map((i) => i.url)}
                  onPick={(item) => setImages((prev) => (prev.some((i) => i.url === item.url) ? prev : [...prev, { url: item.url, name: item.name }]))}
                />
              )}
              {images.length === 0 ? (
                <p className="text-sm text-muted">Nothing chosen. A still is optional; {model.name} can work from the prompt alone.</p>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  {images.map((img, i) => (
                    // Thumbnails keep the image's true aspect ratio (object-contain),
                    // sized by height. Click to expand into the lightbox.
                    <div key={i} className="group relative h-36 overflow-hidden rounded-none border border-line-strong bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        title={img.name}
                        onClick={() => setLightbox(img)}
                        className="h-36 w-auto max-w-[320px] cursor-zoom-in object-contain"
                      />
                      {/* hover: shade the thumbnail (visual only) */}
                      <div className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100" />
                      {/* hover: centered trash button → deletes this image */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        aria-label={`Delete ${img.name}`}
                        title="Delete"
                        className="absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:bg-danger group-hover:opacity-100"
                      >
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.5M7 7v4M9 7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  ))}
                  {/* add-more tile */}
                  <label className="flex h-36 w-36 cursor-pointer items-center justify-center rounded-none border border-dashed border-line-strong text-dim transition-colors hover:border-blue hover:text-blue" title="Add more images">
                    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3 V13 M3 8 H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
                  </label>
                </div>
              )}
            </Field>
          )}

          {/* Reference material, for models whose catalogue row offers it. */}
          {rules?.video && (
            <ReferenceMedia
              kind="video"
              limits={rules.video}
              modelSlug={slug}
              items={refVideos}
              onChange={setRefVideos}
              disabled={referenceBlocked}
              disabledReason="not with a first frame image"
            />
          )}
          {rules?.image && (
            <ReferenceMedia
              kind="image"
              limits={rules.image}
              modelSlug={slug}
              items={refImages}
              onChange={setRefImages}
              disabled={referenceBlocked}
              disabledReason="not with a first frame image"
              // Registering an image with the provider is what lets a likeness
              // through their review, so it is offered where the image is
              // picked rather than in a library of its own.
              offersCharacters={Boolean(model?.characters)}
            />
          )}
          {rules?.audio && (
            <ReferenceMedia
              kind="audio"
              limits={rules.audio}
              modelSlug={slug}
              items={refAudios}
              onChange={setRefAudios}
              disabled={referenceBlocked}
              disabledReason="not with a first frame image"
            />
          )}
          {refProblems.length > 0 && (
            <ul className="border border-danger/60 bg-danger/10 p-3 text-sm text-danger">
              {refProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}

          {/* compact inline controls */}
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            {/* An image has no ratio of its own: the size is the shape, and two
                controls that can disagree about it would be one too many. */}
            {!isImage && (
              <Field label="Aspect ratio">
                <select value={aspect} onChange={(e) => setAspect(e.target.value)} className={compactSelect}>
                  {model.aspectRatios.map((r) => (
                    <option key={r} value={r}>
                      {ASPECT_USE[r] ? `${r} (${ASPECT_USE[r]})` : r}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label={isImage ? "Size" : "Resolution"}
              hint={isImage && model.imageSize?.max_pixels ? `up to ${(model.imageSize.max_pixels / 1e6).toFixed(1)} MP` : undefined}
            >
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={compactSelect}>
                {model.resolutions.map((r) => (
                  <option key={r} value={r}>
                    {model.popularResolutions.includes(r) ? `★ ${r}` : r}
                  </option>
                ))}
              </select>
            </Field>

            {!isImage && (
            <Field label="Duration" hint={`${minDuration}-${maxDuration} sec`}>
              <NumberField
                id="pg-duration"
                min={minDuration}
                max={maxDuration}
                value={duration}
                onValueChange={setDuration}
                onBlur={() => {
                  // Clamp what was typed, but leave an empty box empty: putting
                  // a number back would hide that nothing was chosen. Generate
                  // asks for one instead.
                  if (!isPositive(duration)) return;
                  setDuration(nearestDuration(Math.min(maxDuration, Math.max(minDuration, Math.round(duration)))));
                }}
                className={`${compactInput} w-20`}
              />
            </Field>
            )}

            {!isImage && model.supports.audio && (
              <Field label="Audio">
                <button
                  type="button"
                  role="switch"
                  aria-checked={audio}
                  onClick={() => setAudio((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${audio ? "bg-accent" : "bg-track"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${audio ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </Field>
            )}
          </div>

          {/* What this will cost, at the rate the backend will charge. */}
          {estimate !== null && (
            <p className="text-sm text-muted">
              <span className="font-[family-name:var(--font-jetbrains)] text-base text-accent-ink">{money(estimate.total)}</span>{" "}
              <span>{estimate.parts.join(" + ")}</span>
              {estimate.reserves && (
                <span className="block text-xs text-dim">
                  A reference clip is charged for its own length. Until the provider reports it, the hold assumes the longest it allows.
                </span>
              )}
            </p>
          )}

          {missingReference && (
            <p className="border border-line-strong bg-raised p-3 text-sm text-fg-soft">
              {model.name} follows the material you give it: add {Number(rules?.min_visual || 1) > 1 ? `${rules?.min_visual} references` : "a reference image or clip"} to
              generate.{" "}
              <Link href="/generate?model=minimax-h3" className="text-blue hover:text-gold-soft">
                MiniMax H3
              </Link>{" "}
              generates from a prompt alone.
            </p>
          )}

          <button
            onClick={onGenerate}
            disabled={status === "generating" || refProblems.length > 0 || missingReference}
            title={missingReference ? `${model.name} needs a reference image or clip` : undefined}
            className="w-full rounded-none bg-accent px-6 py-2.5 font-[family-name:var(--font-jetbrains)] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "generating" ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Refine session UI lives in a floating chatbot bar (see below). */}
      </main>

      {/* Preview stage (right): the chosen aspect shape; the video generates here */}
      <section className="pg-preview flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-1 flex-col items-center justify-start gap-2">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">
          Preview
        </span>
        <div
          className="relative overflow-hidden rounded-none border border-line-strong bg-black"
          style={portrait ? { aspectRatio: `${aw} / ${ah}`, height: "min(72vh, 640px)" } : { aspectRatio: `${aw} / ${ah}`, width: "100%", maxWidth: 680 }}
        >
          {status === "complete" && resultUrl ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt={prompt || "Generated image"}
                onClick={() => setLightbox({ url: resultUrl, name: prompt || "Generated image" })}
                className="h-full w-full cursor-zoom-in object-contain"
              />
            ) : (
              <video className="h-full w-full object-contain" src={resultUrl} controls autoPlay muted loop playsInline />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {status === "generating" ? (
                <>
                  <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">
                    Hang tight, generating…
                  </p>
                  <div className="h-1 w-40 overflow-hidden rounded-full bg-raised">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
                  </div>
                </>
              ) : status === "failed" ? (
                // What went wrong, in full, selectable, and still there in ten
                // minutes: a provider's refusal carries the request id that a
                // support ticket needs, and the pane used to say only
                // "Generation failed. Try again."
                <div className="max-w-[34rem] select-text px-4 text-left">
                  <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-danger">
                    Generation failed
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/90">{failure || "Try again."}</p>
                  {failure && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(failure).then(
                          () => toast("Error copied."),
                          () => toast("Could not copy that.", "error"),
                        );
                      }}
                      className="hit mt-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-muted transition-colors hover:text-white"
                    >
                      Copy error
                    </button>
                  )}
                </div>
              ) : (
                <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-muted">
                  {isImage ? resolution : aspect}
                </span>
              )}
            </div>
          )}
        </div>
        {status === "complete" && resultUrl && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={downloadResult} className="rounded-none bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-accent-hover">
                {isImage ? "Download" : "Download MP4"}
              </button>
              {!isImage && (
                <>
                  <button disabled title="Coming soon" className="cursor-not-allowed rounded-none border border-hairline-strong px-4 py-2 text-sm opacity-40">
                    WebM
                  </button>
                  <button disabled title="Coming soon" className="cursor-not-allowed rounded-none border border-hairline-strong px-4 py-2 text-sm opacity-40">
                    GIF
                  </button>
                </>
              )}
              {/* Regenerate re-runs the prompt as it stands; passing the
                  handler directly would hand it the click event as the prompt. */}
              <button onClick={() => regen()} className="rounded-none border border-hairline-strong px-4 py-2 text-sm transition-colors hover:bg-hover">
                Regenerate
              </button>
              <button onClick={startOver} title="Clear everything and begin something different" className="rounded-none border border-hairline-strong px-4 py-2 text-sm transition-colors hover:bg-hover">
                Start over
              </button>
            </div>
            <p className="text-xs text-dim">
              Saved to your{" "}
              <Link href="/library?tab=generated" className="text-blue hover:text-gold-soft">library</Link>
              {" "}· kept in cloud storage, which costs by the gigabyte-month.
              {isImage ? " The link above is the provider's own and expires; the library copy does not." : " WebM & GIF export coming soon."}
            </p>
          </div>
        )}
        </div>
      </section>
      </div>
      )}
      </div>
      </div>

      {/* Floating refine chatbot, fixed to the bottom-center like a chat app. */}
      {session && (
        <div
          className="fixed bottom-5 left-1/2 z-[60] w-[min(92vw,640px)] rounded-[14px] border border-line bg-panel/95 p-3 shadow-xl shadow-black/40 backdrop-blur"
          style={{ transform: `translate(calc(-50% + ${refinePos.x}px), ${refinePos.y}px)` }}
        >
          {/* whole header is the drag handle (buttons excluded) */}
          <div
            onPointerDown={startRefineDrag}
            title="Drag to move"
            className="mb-2 flex cursor-move touch-none select-none items-center justify-between px-1"
          >
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
              <GripHorizontal size={14} className="text-dim" />
              Refine session
            </span>

          </div>

          <div className="flex gap-2">
            <input
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendRefine(); }}
              placeholder="Add an edit and press Enter…  (e.g. “make it slower”, “add rain”)"
              className="flex-1 rounded-none border border-line-strong bg-raised px-3 py-2.5 text-sm text-fg outline-none focus:border-blue"
            />
            <button
              onClick={sendRefine}
              disabled={status === "generating" || !refineInput.trim()}
              className="rounded-none bg-accent px-4 py-2 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-ink transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              Send
            </button>
          </div>
          {/* No provider edits an existing clip: every refinement renders a new
              one, at the same price. Saying so here is the difference between a
              tool and a surprise on the bill. */}
          <p className="mt-2 px-1 text-xs text-dim">
            Your edit is added to the prompt above and the whole thing is rendered again
            {estimate !== null ? ` at ${money(estimate.total)}` : ""} —{" "}
            {isImage ? "no provider edits an existing image" : "no provider edits an existing clip"}.
          </p>
        </div>
      )}

      {/* Expanded image viewer */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-8" onClick={() => setLightbox(null)}>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-black/50 text-white transition-colors hover:bg-danger"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <GenerateInner />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
