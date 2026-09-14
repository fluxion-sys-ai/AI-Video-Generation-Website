"use client";

import { useState } from "react";
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
  const host = BACKEND_ENABLED && typeof window !== "undefined" ? window.location.origin : "https://api.fluxion-sys.ai";

  const params: { name: string; type: string; req?: boolean; desc: string }[] = [
    { name: "prompt", type: "string", req: true, desc: "Text description of the shot." },
    ...(model.supports.image ? [{ name: "image_url", type: "string", desc: "Public URL or data: URI of an image to animate. To upload the file instead, post multipart/form-data with an `image` part." }] : []),
    { name: "seconds", type: "integer", desc: `Clip length (${model.durations[0]}-${model.durations[model.durations.length - 1]}). Defaults to ${model.durations[0]}.` },
    { name: "aspect_ratio", type: "enum", desc: `${model.aspectRatios.join(", ")}. Defaults to ${model.aspectRatios[0]}.` },
    { name: "resolution", type: "enum", desc: `${model.resolutions.join(", ")}. Defaults to ${model.resolutions[0]}.` },
    ...(model.supports.audio ? [{ name: "audio", type: "boolean", desc: "Generate a soundtrack." }] : []),
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
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
