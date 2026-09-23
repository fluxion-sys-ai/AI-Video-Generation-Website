"use client";

import { useEffect, useState } from "react";
import type { Model } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { CopyButton } from "@/components/docs/copy-button";

type Lang = "js" | "python" | "curl";

export function ApiDocs({ model }: { model: Model }) {
  // Two documents, not one with branches in it. An image request shares the
  // key and the host and nothing else: no polling, no download step, no
  // duration, no ratio, a different route and a different response. Writing it
  // as conditionals inside the video docs would make both harder to read than
  // either is worth.
  if (model.modality === "image") return <ImageApiDocs model={model} />;
  return <VideoApiDocs model={model} />;
}

function VideoApiDocs({ model }: { model: Model }) {
  const [lang, setLang] = useState<Lang>("js");

  const ar = model.aspectRatios[0];
  const res = model.popularResolutions[0] || model.resolutions[0];
  const dur = model.durations[0];
  // The value of the request's "model" field: the hub's own model name.
  const id = model.hubModel || model.slug;
  // After mount, not during render: this site is a static export, so reading
  // window.location while rendering makes the browser's first pass disagree
  // with the built HTML. It happened to be harmless here only because these
  // snippets sit behind a tab; it is a hydration mismatch either way.
  const [host, setHost] = useState("https://api.fluxion-sys.ai");
  useEffect(() => {
    if (BACKEND_ENABLED) setHost(window.location.origin);
  }, []);

  // Reference limits come from the model's catalogue row, so what is documented
  // is what the platform enforces - there is no second copy to keep in step.
  const ref = model.reference;
  // Some models cannot work from a prompt alone: a reference-to-video
  // deployment follows material rather than inventing it. Documenting a
  // text-only request for one of those is documenting a request that fails, so
  // the examples below carry a reference when the catalogue says one is needed.
  const minVisual = Number(ref?.min_visual || 0);
  const needsReference = minVisual > 0;
  const refLine = needsReference
    ? `,\n    "metadata": { "reference_image": ["$REFERENCE_0A7304DE"] }`
    : "";
  const list = (values: string[] | undefined) => (values || []).map((v) => v.toUpperCase()).join(", ");
  const mb = (bytes: number | undefined) => (bytes ? `${Math.round(bytes / 1048576)} MB` : "");
  const refDesc = (kind: "video" | "audio" | "image") => {
    const limits = ref?.[kind];
    if (!limits) return "";
    const bits: string[] = [];
    if (limits.max_count) bits.push(`up to ${limits.max_count}`);
    if (limits.formats?.length) bits.push(list(limits.formats));
    if (limits.codecs?.length) bits.push(list(limits.codecs));
    if (limits.min_seconds != null && limits.max_seconds != null) bits.push(`${limits.min_seconds}-${limits.max_seconds}s each`);
    if (limits.max_total_seconds != null) bits.push(`${limits.max_total_seconds}s in total`);
    if (limits.max_bytes) bits.push(`${mb(limits.max_bytes)} each`);
    if (limits.min_px && limits.max_px) bits.push(`${limits.min_px}-${limits.max_px}px per side`);
    if (limits.min_aspect && limits.max_aspect) bits.push(`aspect ${limits.min_aspect}-${limits.max_aspect}`);
    return bits.join(", ");
  };
  const price = (kind: "video" | "audio" | "image") => {
    const limits = ref?.[kind];
    if (!limits) return "";
    if (limits.billed_at_output_rate) return " Charged by its own duration, at the rate for the resolution you generate.";
    if (limits.usd_per_second) return ` Charged at $${limits.usd_per_second} per second of the input.`;
    if (limits.usd_each) return ` The first ${limits.free_count ?? 0} are free, then $${limits.usd_each} each.`;
    return " Free.";
  };

  const params: { name: string; type: string; req?: boolean; desc: string }[] = [
    { name: "prompt", type: "string", req: true, desc: "Text description of the shot." },
    ...(needsReference
      ? [{
          name: "metadata.reference_image",
          type: "string[]",
          req: true,
          desc: `${model.name} follows material rather than inventing it, so at least ${minVisual} reference image or clip is required — a request with a prompt alone is refused. Use metadata.reference_video instead if you are following a clip.`,
        }]
      : []),
    ...(model.supports.image ? [{ name: "image_url", type: "string", desc: "Public https URL or data: URI of an image to animate (the first frame). To upload the file instead, post multipart/form-data with an `image` part." }] : []),
    { name: "seconds", type: "integer", desc: `Clip length (${model.durations[0]}-${model.durations[model.durations.length - 1]}). Defaults to ${model.durations[0]}. Also accepted as \`duration\`.` },
    { name: "aspect_ratio", type: "enum", desc: `${model.aspectRatios.join(", ")}. Defaults to ${model.aspectRatios[0]}. Also accepted as \`ratio\`, and \`adaptive\` when there is a visual input.` },
    { name: "resolution", type: "enum", desc: `${model.resolutions.join(", ")}. Defaults to ${model.resolutions[0]}.` },
    ...(model.supports.audio ? [{ name: "audio", type: "boolean", desc: "Generate a soundtrack." }] : []),
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
    // Only this model plans against a deadline, and only because it runs on our
    // own hardware: the numbers are calibrated to that machine.
    ...(id === "MiniMax-H3-Fast"
      ? [{
          name: "metadata.generation_time_budget_s",
          type: "number",
          desc: "A ceiling, in seconds, on how long the model may spend. Given one, the clip is planned to fit: the area given to reference images is trimmed first and the generation canvas is lowered only after that, so what you asked for stays recognisable while it gets cheaper to make. Measured warm on our B200 for a 5 s clip with three references — 3.6 s by default, 2.6 s at a budget of 3, 1.3 s at a budget of 2. Omit it and nothing changes. A budget too small for the references is refused, with the numbers that made it impossible.",
        }]
      : []),
    ...(ref?.video
      ? [{
          name: "metadata.reference_video",
          type: "string | string[]",
          desc: `https URLs of clips the model should follow: ${refDesc("video")}.${price("video")}`,
        }]
      : []),
    ...(ref?.audio
      ? [{
          name: "metadata.reference_audio",
          type: "string | string[]",
          desc: `https URLs of audio the model should follow: ${refDesc("audio")}.${price("audio")}`,
        }]
      : []),
    ...(ref?.image
      ? [{
          name: "metadata.reference_image",
          type: "string | string[]",
          desc: `Images the model should draw on: ${refDesc("image")}.${price("image")} Each is a public https URL or the \`reference\` of one of your assets ($REFERENCE_…, from GET /v1/assets); the two mix freely in one list. Order is the order you send them, and the prompt names them by position — "the woman in Image 1" — never by id.`,
        }]
      : []),
    ...(model.characters
      ? [{
          name: "metadata.reference_image (portraits)",
          type: "string[]",
          desc: `A portrait — an image registered with the provider as a reusable character — travels in this same list, by its own $REFERENCE_. Make one with POST /v1/assets -F portrait=true. Registering is what keeps a character consistent between clips and what lets a likeness past the provider's review; ${model.characters.max_count ?? 8} may be named at once. See Assets in the docs.`,
        }]
      : []),
    ...(model.supports.image
      ? [{
          name: "metadata.last_frame_image",
          type: "string",
          desc: "Image to end on. Needs a first frame too, and cannot be combined with reference material.",
        }]
      : []),
    ...(ref
      ? [{
          name: "metadata.content",
          type: "array",
          desc: "The provider's own multimodal array, passed through: items of type text, image_url, video_url or audio_url, each with a role of first_frame, last_frame, reference_image, reference_video or reference_audio. A url may be an https link, a data: URI, or a $REFERENCE_ naming one of your assets. Send this instead of the fields above, not as well.",
        }]
      : []),
  ];

  const snippets: Record<Lang, string> = {
    js: `const base = "${host}";
const auth = { Authorization: "Bearer " + process.env.FLUXION_API_KEY };

// 1. Submit the job. Credits are held when this returns.
const submit = await fetch(base + "/v1/videos", {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "${id}",
    prompt: "${needsReference ? "Follow the motion in Image 1" : "A cinematic aerial shot at golden hour"}",
    seconds: ${dur},
    resolution: "${res}",
    aspect_ratio: "${ar}",${needsReference ? `
    // ${model.name} follows material rather than inventing it: at least
    // ${minVisual} reference is required. Store one with POST /v1/assets.
    metadata: { reference_image: ["$REFERENCE_0A7304DE"] },` : ""}
  }),
});
let video = await submit.json();

// 2. Poll until it finishes (usually under a minute).
while (video.status === "queued" || video.status === "in_progress") {
  await new Promise((r) => setTimeout(r, 3000));
  video = await (await fetch(base + "/v1/videos/" + video.id, { headers: auth })).json();
}
if (video.status !== "completed") throw new Error(video.error?.message ?? "generation failed");

// 3. Download the MP4. The endpoint honours Range requests, so it also
//    works as the src of a <video> element with a short-lived key.
const mp4 = await fetch(base + "/v1/videos/" + video.id + "/content", { headers: auth });
await writeFile("out.mp4", Buffer.from(await mp4.arrayBuffer()));`,
    python: `import os, time, requests

base = "${host}"
auth = {"Authorization": "Bearer " + os.environ["FLUXION_API_KEY"]}

# 1. Submit the job. Credits are held when this returns.
video = requests.post(base + "/v1/videos", headers=auth, json={
    "model": "${id}",
    "prompt": "${needsReference ? "Follow the motion in Image 1" : "A cinematic aerial shot at golden hour"}",
    "seconds": ${dur},
    "resolution": "${res}",
    "aspect_ratio": "${ar}",${needsReference ? `
    # ${model.name} follows material rather than inventing it: at least
    # ${minVisual} reference is required. Store one with POST /v1/assets.
    "metadata": {"reference_image": ["$REFERENCE_0A7304DE"]},` : ""}
}).json()

# 2. Poll until it finishes (usually under a minute).
while video["status"] in ("queued", "in_progress"):
    time.sleep(3)
    video = requests.get(base + "/v1/videos/" + video["id"], headers=auth).json()

if video["status"] != "completed":
    raise RuntimeError(video.get("error", {}).get("message", "generation failed"))

# 3. Download the MP4.
mp4 = requests.get(base + "/v1/videos/" + video["id"] + "/content", headers=auth)
open("out.mp4", "wb").write(mp4.content)`,
    curl: `# 1. Submit the job; the response carries the video id.
curl -X POST ${host}/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "prompt": "${needsReference ? "Follow the motion in Image 1" : "A cinematic aerial shot at golden hour"}",
    "seconds": ${dur},
    "resolution": "${res}",
    "aspect_ratio": "${ar}"${refLine}
  }'

# 2. Poll that id until "status": "completed".
curl ${host}/v1/videos/$VIDEO_ID \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

# 3. Download the MP4.
curl -L -o out.mp4 ${host}/v1/videos/$VIDEO_ID/content \\
  -H "Authorization: Bearer $FLUXION_API_KEY"`,
  };

  const response = `{
  "id": "task_XOS18pgsIx9aEmdKGjqHL69pwMZcmrXK",
  "object": "video",
  "model": "${id}",
  "status": "completed",
  "progress": 100,
  "created_at": 1789368841,
  "completed_at": 1789368862,
  "seconds": "${dur}",
  "size": "1280x720",
  "metadata": {
    "prompt": "A cinematic aerial shot at golden hour",
    "resolution": "${res}",
    "aspect_ratio": "${ar}",
    "audio": ${model.supports.audio ? "true" : "false"},
    "has_image": false
  }
}`;

  // Both shapes in one example: our field names, and the provider's own array
  // for anyone porting code that already speaks it.
  // The library route, which takes the same API key: upload once, reference it
  // as often as you like, and let the platform check it against the limits.
  // Several references at once, mixing stored assets with URLs of your own,
  // because that is what a real request looks like and it is where the two
  // things people get wrong live: the prompt refers to attachments by
  // position, and the position is the order of the list.
  const referenceSnippet = `curl -sS ${host}/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "prompt": "The woman in Image 1 wears the jacket from Image 2 and walks through
               the street in Image 3, matching the camera move of Video 1.",
    "seconds": ${dur},
    "resolution": "${res}",
    "aspect_ratio": "${ar}",
    "metadata": {
      "reference_image": [
        "$REFERENCE_0A7304DE",
        "$REFERENCE_31CA18C7",
        "https://example.com/street.jpg"
      ],
      "reference_video": ["$REFERENCE_9F2C41B8"]
    }
  }'

# Image 1, Image 2, Image 3 are the reference_image entries in that order;
# Video 1 is the reference_video. Numbering restarts per type, and a plain URL
# counts the same as an asset - what matters is position, not where it came
# from. Never write an id or a $REFERENCE_ in the prompt: it is not recognised
# and the model reads it as words.

# The same request in the provider's own vocabulary, which is accepted as-is.
# Here the order is simply the order of the array:
#   "metadata": { "content": [
#     { "type": "image_url", "image_url": { "url": "$REFERENCE_0A7304DE" },
#       "role": "reference_image" },
#     { "type": "video_url", "video_url": { "url": "https://example.com/clip.mp4" },
#       "role": "reference_video" }
#   ]}`;

  const librarySnippet = `# 1. Store the file once. Returns its id and a reference.
curl -sS ${host}/v1/assets \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -F file=@clip.mp4 -F name="dolly shot"
# -> {"id":"9f2c41b8…","type":"video","portrait":false,
#     "reference":"$REFERENCE_9F2C41B8", …}

# 2. Use that reference as often as you like. It does not expire.
curl -sS ${host}/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{"model": "${id}", "prompt": "Match the camera move of Video 1", "seconds": ${dur},
       "resolution": "${res}", "metadata": {"reference_video": ["$REFERENCE_9F2C41B8"]}}'

# A file that breaks one of ${model.name}'s rules is refused when it is used,
# with the reason:
#   {"detail":{"message":"clip.mp4 is 20s; the maximum is 15s","problems":[…]}}

# 3. What do I have? What can go?
curl -sS ${host}/v1/assets -H "Authorization: Bearer $FLUXION_API_KEY"
curl -sS -X DELETE ${host}/v1/assets/9f2c41b8… -H "Authorization: Bearer $FLUXION_API_KEY"`;

  const langLabel: Record<Lang, string> = { js: "JavaScript", python: "Python", curl: "cURL" };

  return (
    <div className="max-w-3xl">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">API</span>
      <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">
        {model.name} API
      </h1>
      <p className="mt-2 text-sm text-muted">
        Call this model over HTTP at{" "}
        <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">POST /v1/videos</code>{" "}
        with <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">&quot;model&quot;: &quot;{id}&quot;</code>
      </p>

      {/* auth */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">1. Authenticate</h2>
        <p className="mt-2 text-sm text-muted">
          Create a key under Profile → API keys, then set it as an environment variable. Every
          request carries it as a bearer token:
        </p>
        <div className="relative mt-3">
          <CopyButton text={'export FLUXION_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"'} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
            <code>export FLUXION_API_KEY=&quot;sk-xxxxxxxxxxxxxxxxxxxx&quot;</code>
          </pre>
        </div>
      </section>

      {/* request */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">2. Submit, poll, download</h2>
        <p className="mt-2 text-sm text-muted">
          Generation is asynchronous: submitting returns a video id and holds its cost against your balance, then you
          poll that id until its status is <code className="text-gold-2">completed</code> and fetch the MP4.
        </p>
        <div className="mt-3 flex gap-4 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
          {(["js", "python", "curl"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`pb-1 transition-colors ${lang === l ? "border-b border-accent text-accent-ink" : "text-muted hover:text-fg"}`}
            >
              {langLabel[l]}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <CopyButton text={snippets[lang]} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
            <code>{snippets[lang]}</code>
          </pre>
        </div>
      </section>

      {/* input schema */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Input parameters</h2>
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-line-strong">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr className="border-b border-line-strong">
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name} className="border-b border-hairline last:border-0 align-top">
                  <td className="px-4 py-2.5 font-[family-name:var(--font-jetbrains)] text-gold-2">
                    {p.name}{p.req && <span className="text-danger"> *</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{p.type}</td>
                  <td className="px-4 py-2.5 text-fg-soft">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-dim"><span className="text-danger">*</span> required</p>
      </section>

      {/* reference material */}
      {ref && (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">
            Reference video, audio and images
          </h2>
          <p className="mt-2 text-sm text-muted">
            Hand {model.name} material to follow rather than a still to start from. Each entry is either a
            public https URL of your own or the <code className="text-gold-2">reference</code> of one of your
            assets (<code className="text-gold-2">GET /v1/assets</code>), and the two mix freely in one list.
            A first or last frame image and reference material are different modes and cannot be combined in
            one request.
          </p>
          <div className="relative mt-3">
            <CopyButton text={referenceSnippet} />
            <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
              <code>{referenceSnippet}</code>
            </pre>
          </div>
          <p className="mt-3 text-xs text-dim">
            A reference clip is charged for its own length, so the amount held when you submit assumes the longest
            input allowed and settles to the real duration when the provider reports it.
          </p>

          <h3 className="mt-6 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-fg-soft">
            Storing a file instead of hosting one
          </h3>
          <p className="mt-2 text-sm text-muted">
            You do not need to host anything. The same API key works on{" "}
            <code className="text-gold-2">/v1/assets</code>, so a clip is uploaded once and referenced as often
            as you like. Uploading is permissive — any video or audio — and a file is only judged against this
            model&apos;s rules when you actually use it.
          </p>
          <div className="relative mt-3">
            <CopyButton text={librarySnippet} />
            <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
              <code>{librarySnippet}</code>
            </pre>
          </div>
          <p className="mt-3 text-xs text-dim">
            Stored files are charged by the gigabyte-month (see Pricing); deleting one stops its charge.
            A reference that names nothing is refused before the job is submitted, so a typo costs a message
            rather than a generation.
          </p>
        </section>
      )}

      {/* response */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Response</h2>
        <div className="relative mt-3">
          <CopyButton text={response} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
            <code>{response}</code>
          </pre>
        </div>
        <p className="mt-3 text-xs text-dim">
          A job that fails comes back as <code className="text-gold-2">&quot;status&quot;: &quot;failed&quot;</code> with an{" "}
          <code className="text-gold-2">error.message</code>, and the amount held is returned.
        </p>
      </section>
    </div>
  );
}

/**
 * The same model, over HTTP: image generation.
 *
 * Deliberately short, because the request is short. There is no job to poll and
 * no artefact to fetch afterwards - the picture is in the response - so the
 * whole API is one call, and the only things worth explaining at length are the
 * two that cost money in ways a reader would not guess: an input image after
 * the first is charged, and the copy we keep outlives the URL that comes back.
 *
 * Every figure here is read from the model's catalogue row, the same row the
 * backend bills from, so there is no second copy of a price to drift.
 */
function ImageApiDocs({ model }: { model: Model }) {
  const [lang, setLang] = useState<Lang>("js");
  const id = model.hubModel || model.slug;
  const size = model.popularResolutions[0] || model.resolutions[0];
  const [host, setHost] = useState("https://api.fluxion-sys.ai");
  useEffect(() => {
    if (BACKEND_ENABLED) setHost(window.location.origin);
  }, []);

  const input = model.reference?.image;
  const free = input?.free_count ?? 0;
  const each = input?.usd_each ?? 0;
  const output = model.usdPerImage;
  const mp = (pixels: number | undefined) => (pixels ? `${(pixels / 1e6).toFixed(1)} MP` : "");

  const params: { name: string; type: string; req?: boolean; desc: string }[] = [
    { name: "model", type: "string", req: true, desc: `"${id}".` },
    { name: "prompt", type: "string", req: true, desc: "What to make." },
    {
      name: "size",
      type: "enum",
      desc: `${model.resolutions.join(", ")}. Defaults to ${size}. Any width x height inside ${mp(model.imageSize?.min_pixels)}-${mp(model.imageSize?.max_pixels)} is accepted, not only the listed presets — the shape of the picture is this field and there is no separate aspect ratio.`,
    },
    ...(input
      ? [{
          name: "image",
          type: "string | string[]",
          desc: `Images to work from, for image-to-image. Each is a public https URL, a data: URI, or the \`reference\` of one of your assets ($REFERENCE_…, from POST /v1/assets); the three mix freely in one list. Up to ${input.max_count ?? 10}.${each ? ` The first ${free} ${free === 1 ? "is" : "are"} free, then $${each} each.` : ""}`,
        }]
      : []),
    { name: "response_format", type: "enum", desc: "url (default) or b64_json. A url expires; see below." },
    { name: "watermark", type: "boolean", desc: 'Defaults to false. The provider would otherwise mark the corner "AI generated"; send true if you want it.' },
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
  ];

  const body = `{
    "model": "${id}",
    "prompt": "A cut-glass decanter on dark walnut, late afternoon light",
    "size": "${size}"
  }`;

  const snippets: Record<Lang, string> = {
    js: `const base = "${host}";
const auth = { Authorization: "Bearer " + process.env.FLUXION_API_KEY };

// One call. The picture is in the response; there is nothing to poll.
const res = await fetch(base + "/v1/images/generations", {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "${id}",
    prompt: "A cut-glass decanter on dark walnut, late afternoon light",
    size: "${size}",
  }),
});
const { data } = await res.json();

// data[0].url is the provider's own and expires. Save the bytes, or ask for
// response_format: "b64_json" and skip this fetch.
const bytes = await (await fetch(data[0].url)).arrayBuffer();
await writeFile("out.png", Buffer.from(bytes));`,
    python: `import os, requests

base = "${host}"
auth = {"Authorization": "Bearer " + os.environ["FLUXION_API_KEY"]}

# One call. The picture is in the response; there is nothing to poll.
out = requests.post(base + "/v1/images/generations", headers=auth, json={
    "model": "${id}",
    "prompt": "A cut-glass decanter on dark walnut, late afternoon light",
    "size": "${size}",
}).json()

# The url is the provider's own and expires. Save the bytes, or ask for
# response_format: "b64_json" and skip this fetch.
open("out.png", "wb").write(requests.get(out["data"][0]["url"]).content)`,
    curl: `curl -sS ${host}/v1/images/generations \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${body}'

# -> {"created": 1789368841,
#     "data": [{"url": "https://…"}],
#     "usage": {"generated_images": 1}}

# The url expires. For the bytes in the response instead:
#   "response_format": "b64_json"`,
  };

  const imageToImage = `# 1. Store an image once; the reference does not expire.
curl -sS ${host}/v1/assets \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -F file=@room.jpg -F name="the room"
# -> {"id":"0a7304de…","type":"image","portrait":false,
#     "reference":"$REFERENCE_0A7304DE", …}

# 2. Work from it, alongside anything else you already host.
curl -sS ${host}/v1/images/generations \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "prompt": "The room in Image 1, restyled with the palette of Image 2",
    "size": "${size}",
    "image": [
      "$REFERENCE_0A7304DE",
      "https://example.com/palette.jpg"
    ]
  }'

# Image 1 and Image 2 are the entries in that order, and a plain URL counts the
# same as a stored asset - what matters is position, not where it came from.
# Never write an id or a $REFERENCE_ in the prompt: it is not recognised and the
# model reads it as words.${each ? `
#
# This request has ${free + 1} input image${free + 1 === 1 ? "" : "s"}: the first ${free} ${free === 1 ? "is" : "are"} free and the rest are
# $${each} each, on top of $${output ?? "—"} for the picture itself.` : ""}`;

  const langLabel: Record<Lang, string> = { js: "JavaScript", python: "Python", curl: "cURL" };

  return (
    <div className="max-w-3xl">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">API</span>
      <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">
        {model.name} API
      </h1>
      <p className="mt-2 text-sm text-muted">
        Call this model over HTTP at{" "}
        <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">POST /v1/images/generations</code>{" "}
        with <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">&quot;model&quot;: &quot;{id}&quot;</code>.
        The route is OpenAI-shaped, so an existing images client works by pointing it here.
      </p>

      {/* auth */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">1. Authenticate</h2>
        <p className="mt-2 text-sm text-muted">
          Create a key under Profile → API keys, then set it as an environment variable. Every request carries it as
          a bearer token — the same key that generates video.
        </p>
        <div className="relative mt-3">
          <CopyButton text={'export FLUXION_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"'} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
            <code>export FLUXION_API_KEY=&quot;sk-xxxxxxxxxxxxxxxxxxxx&quot;</code>
          </pre>
        </div>
      </section>

      {/* the one call */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">2. Generate</h2>
        <p className="mt-2 text-sm text-muted">
          One request, one image. The call holds open for the seconds the render takes and the picture comes back in
          the response — unlike video, there is no job to poll and no id to poll it with. One image per request:{" "}
          <code className="text-gold-2">n</code> is refused rather than silently ignored.
        </p>
        <div className="mt-3 flex gap-4 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
          {(["js", "python", "curl"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`pb-1 transition-colors ${lang === l ? "border-b border-accent text-accent-ink" : "text-muted hover:text-fg"}`}
            >
              {langLabel[l]}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <CopyButton text={snippets[lang]} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
            <code>{snippets[lang]}</code>
          </pre>
        </div>
        <p className="mt-3 text-xs text-dim">
          Every image is also kept in your own storage and appears under Library, so the expiring URL above is not
          the only copy. Stored files are charged by the gigabyte-month (see Pricing); deleting one stops its charge.
        </p>
      </section>

      {/* input schema */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">Input parameters</h2>
        <div className="mt-3 overflow-x-auto rounded-[10px] border border-line-strong">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-muted">
              <tr className="border-b border-line-strong">
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name} className="border-b border-hairline last:border-0 align-top">
                  <td className="px-4 py-2.5 font-[family-name:var(--font-jetbrains)] text-gold-2">
                    {p.name}{p.req && <span className="text-danger"> *</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{p.type}</td>
                  <td className="px-4 py-2.5 text-fg-soft">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-dim"><span className="text-danger">*</span> required</p>
      </section>

      {/* image to image */}
      {input && (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">
            Working from an image
          </h2>
          <p className="mt-2 text-sm text-muted">
            Put what you are working from in <code className="text-gold-2">image</code>. You do not need to host
            anything: the same API key works on <code className="text-gold-2">/v1/assets</code>, so a picture is
            uploaded once and referenced as often as you like. The prompt refers to inputs by position — &ldquo;Image
            1&rdquo;, &ldquo;Image 2&rdquo; — in the order you sent them.
          </p>
          <div className="relative mt-3">
            <CopyButton text={imageToImage} />
            <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
              <code>{imageToImage}</code>
            </pre>
          </div>
        </section>
      )}

      {/* price */}
      {output !== undefined && (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">What it costs</h2>
          <p className="mt-2 text-sm text-muted">
            <span className="font-[family-name:var(--font-jetbrains)] text-base text-accent-ink">${output}</span> per
            image, whatever the size{each ? (
              <>
                , plus <span className="font-[family-name:var(--font-jetbrains)] text-accent-ink">${each}</span> for
                each input image past the first {free}
              </>
            ) : (
              ", and the same whether you start from a prompt or from an image"
            )}
            . Your balance is charged when the image is made; a refused request costs nothing.
          </p>
        </section>
      )}
    </div>
  );
}
