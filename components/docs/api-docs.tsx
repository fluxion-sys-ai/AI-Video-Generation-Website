"use client";

import { useEffect, useState } from "react";
import type { Model } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { CopyButton } from "@/components/docs/copy-button";

type Lang = "js" | "python" | "curl";

export function ApiDocs({ model }: { model: Model }) {
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
    ...(model.supports.image ? [{ name: "image_url", type: "string", desc: "Public https URL or data: URI of an image to animate (the first frame). To upload the file instead, post multipart/form-data with an `image` part." }] : []),
    { name: "seconds", type: "integer", desc: `Clip length (${model.durations[0]}-${model.durations[model.durations.length - 1]}). Defaults to ${model.durations[0]}. Also accepted as \`duration\`.` },
    { name: "aspect_ratio", type: "enum", desc: `${model.aspectRatios.join(", ")}. Defaults to ${model.aspectRatios[0]}. Also accepted as \`ratio\`, and \`adaptive\` when there is a visual input.` },
    { name: "resolution", type: "enum", desc: `${model.resolutions.join(", ")}. Defaults to ${model.resolutions[0]}.` },
    ...(model.supports.audio ? [{ name: "audio", type: "boolean", desc: "Generate a soundtrack." }] : []),
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
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
          desc: `Images the model should draw on: ${refDesc("image")}.${price("image")} Each is a public https URL, or a value returned by POST /media/library/references — which also yields an asset:// reference for a registered portrait. Order is the order you send: the prompt names them by position, as "Image 1", "Image 2".`,
        }]
      : []),
    ...(model.characters
      ? [{
          name: "metadata.reference_image (portraits)",
          type: "string[]",
          desc: `A portrait — an image registered with the provider as a reusable character — travels in this same list as asset://<id>, obtained from POST /media/library/references. Registering is what keeps a character consistent between clips, and what lets a likeness past the provider's review; ${model.characters.max_count ?? 8} may be named at once. See Library & assets in the docs.`,
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
          desc: "The provider's own multimodal array, passed through: items of type text, image_url, video_url or audio_url, each with a role of first_frame, last_frame, reference_image, reference_video or reference_audio. A url may be an https link, a data: URI, or an asset:// reference to a registered portrait. Send this instead of the fields above, not as well.",
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
    prompt: "A cinematic aerial shot at golden hour",
    seconds: ${dur},
    resolution: "${res}",
    aspect_ratio: "${ar}",
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
    "prompt": "A cinematic aerial shot at golden hour",
    "seconds": ${dur},
    "resolution": "${res}",
    "aspect_ratio": "${ar}",
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
    "prompt": "A cinematic aerial shot at golden hour",
    "seconds": ${dur},
    "resolution": "${res}",
    "aspect_ratio": "${ar}"
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
  const librarySnippet = `# 1. Put the clip in your library (once). Any video or audio is accepted.
curl -sS ${host}/media/library/media \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -F file=@clip.mp4
# -> {"id":"9f2c…","kind":"video","duration_seconds":6.0,"codec":"h264", …}

# 2. Ask for it as a reference. This is where ${model.name}'s rules are applied -
#    format, codec, size, duration, counts, totals - and where the links come from.
curl -sS ${host}/media/library/references \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{"model": "${model.slug}", "reference_video": ["9f2c…"]}'
# -> {"ok":true,"facts":{"input_video_seconds":6,"input_images":0,"input_audios":0},
#     "urls":{"reference_video":["https://…"]},"expires_at":1789460000}
# A file that breaks a rule comes back as 422 with the reason:
#   {"detail":{"message":"clip.mp4 is 20s; the maximum is 15s","problems":[…]}}

# 3. Generate with those URLs.
curl -sS ${host}/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{"model": "${id}", "prompt": "Match this motion", "seconds": ${dur},
       "resolution": "${res}", "metadata": {"reference_video": ["https://…"]}}'`;

  const referenceSnippet = `curl -sS ${host}/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "prompt": "Match the motion of the reference clip",
    "seconds": ${dur},
    "resolution": "${res}",
    "metadata": {
      "reference_video": ["https://example.com/clip.mp4"],
      "reference_audio": ["https://example.com/voice.wav"]
    }
  }'

# The same request in the provider's own vocabulary, which is accepted as-is:
#   "metadata": { "content": [
#     { "type": "video_url", "video_url": { "url": "https://example.com/clip.mp4" },
#       "role": "reference_video" }
#   ]}`;

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
            Hand {model.name} material to follow rather than a still to start from. The URLs must be https and
            reachable by the provider; anything in your library has a link for exactly this
            (<code className="text-gold-2">POST /media/library/references</code> checks a selection against the
            limits above and returns them). A first or last frame image and reference material are different modes
            and cannot be combined in one request.
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
            Using your library, from the API
          </h3>
          <p className="mt-2 text-sm text-muted">
            You do not need to host the files. The same API key works on the library routes, so a clip can be
            uploaded once and referenced as often as you like, and the platform hands you links the provider can
            fetch. Uploading is permissive - any video or audio - and a file is only judged when you ask to use it.
          </p>
          <div className="relative mt-3">
            <CopyButton text={librarySnippet} />
            <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
              <code>{librarySnippet}</code>
            </pre>
          </div>
          <p className="mt-3 text-xs text-dim">
            Stored files are charged by the gigabyte-month (see Pricing); deleting one stops its charge.
            <code className="ml-1 text-gold-2">GET /media/library/media</code> lists what you have,
            <code className="ml-1 text-gold-2">DELETE /media/library/media/&#123;id&#125;</code> removes one.
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
