"use client";

import { useState } from "react";
import type { Model } from "@/lib/models";
import { CopyButton } from "@/components/copy-button";

type Lang = "js" | "python" | "curl";

export function ApiDocs({ model }: { model: Model }) {
  const [lang, setLang] = useState<Lang>("js");

  const ar = model.aspectRatios[0];
  const res = model.popularResolutions[0] || model.resolutions[0];
  const dur = model.durations[0];
  const id = model.slug;
  const minDur = Math.min(...model.durations);
  const maxDur = Math.max(...model.durations);
  const size = ({ "480p": "854x480", "720p": "1280x720", "1080p": "1920x1080" } as Record<string, string>)[res] ?? "1280x720";

  const params: { name: string; type: string; req?: boolean; desc: string }[] = [
    { name: "model", type: "string", req: true, desc: `Model id: "${id}".` },
    { name: "prompt", type: "string", req: true, desc: "Text description of the shot." },
    ...(model.supports.image ? [{ name: "image", type: "string | file", desc: "Optional image to animate: an https URL or base64 data URL, or a multipart file." }] : []),
    { name: "seconds", type: "integer", desc: `Seconds of output (${minDur}-${maxDur}).` },
    { name: "aspect_ratio", type: "enum", desc: model.aspectRatios.join(", ") },
    { name: "resolution", type: "enum", desc: model.resolutions.join(", ") },
    ...(model.supports.audio ? [{ name: "audio", type: "boolean", desc: "Generate a soundtrack." }] : []),
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
  ];

  const snippets: Record<Lang, string> = {
    js: `const API = "https://api.fluxion-sys.ai";
const headers = {
  Authorization: \`Bearer \${process.env.FLUXION_API_KEY}\`,
  "Content-Type": "application/json",
};

// Start the job
let video = await fetch(\`\${API}/v1/videos\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "${id}",
    prompt: "A cinematic aerial shot at golden hour",
    seconds: ${dur},
    aspect_ratio: "${ar}",
    resolution: "${res}",
  }),
}).then((r) => r.json());

// Poll until it finishes
while (video.status === "queued" || video.status === "in_progress") {
  await new Promise((r) => setTimeout(r, 5000));
  video = await fetch(\`\${API}/v1/videos/\${video.id}\`, { headers }).then((r) => r.json());
}

// Download the MP4
const mp4 = await fetch(\`\${API}/v1/videos/\${video.id}/content\`, { headers });`,
    python: `import os, time
import requests

API = "https://api.fluxion-sys.ai"
headers = {"Authorization": f"Bearer {os.environ['FLUXION_API_KEY']}"}

video = requests.post(f"{API}/v1/videos", headers=headers, json={
    "model": "${id}",
    "prompt": "A cinematic aerial shot at golden hour",
    "seconds": ${dur},
    "aspect_ratio": "${ar}",
    "resolution": "${res}",
}).json()

while video["status"] in ("queued", "in_progress"):
    time.sleep(5)
    video = requests.get(f"{API}/v1/videos/{video['id']}", headers=headers).json()

with open("out.mp4", "wb") as f:
    f.write(requests.get(f"{API}/v1/videos/{video['id']}/content", headers=headers).content)`,
    curl: `# Start the job
curl -X POST https://api.fluxion-sys.ai/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${id}",
    "prompt": "A cinematic aerial shot at golden hour",
    "seconds": ${dur},
    "aspect_ratio": "${ar}",
    "resolution": "${res}"
  }'

# Poll (repeat until "status" is "completed")
curl https://api.fluxion-sys.ai/v1/videos/VIDEO_ID \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

# Download the MP4
curl -o out.mp4 https://api.fluxion-sys.ai/v1/videos/VIDEO_ID/content \\
  -H "Authorization: Bearer $FLUXION_API_KEY"`,
  };

  const response = `{
  "id": "task_9f3aXk2b7QeLm1Rt",
  "object": "video",
  "model": "${id}",
  "status": "completed",
  "progress": 100,
  "created_at": 1789090065,
  "completed_at": 1789090081,
  "seconds": "${dur}",
  "size": "${size}",
  "metadata": {
    "prompt": "A cinematic aerial shot at golden hour",
    "resolution": "${res}",
    "aspect_ratio": "${ar}",
    "seed": 812043
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
        Call this model over HTTP. Model id:{" "}
        <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">{id}</code>
      </p>

      {/* auth */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">1. Authenticate</h2>
        <p className="mt-2 text-sm text-muted">
          Create a key in your dashboard and set it as an environment variable:
        </p>
        <pre className="relative mt-3 overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
          <CopyButton text={'export FLUXION_API_KEY="sk-xxxxxxxxxxxxxxxx"'} />
          <code>export FLUXION_API_KEY=&quot;sk-xxxxxxxxxxxxxxxx&quot;</code>
        </pre>
      </section>

      {/* request */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">2. Run the model</h2>
        <div className="mt-3 flex gap-4 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
          {(["js", "python", "curl"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`pb-1 transition-colors ${lang === l ? "border-b border-accent text-accent" : "text-muted hover:text-fg"}`}
            >
              {langLabel[l]}
            </button>
          ))}
        </div>
        <pre className="relative mt-3 overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
          <CopyButton text={snippets[lang]} />
          <code>{snippets[lang]}</code>
        </pre>
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
        <pre className="relative mt-3 overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
          <CopyButton text={response} />
          <code>{response}</code>
        </pre>
        <p className="mt-3 text-xs text-dim">Jobs run asynchronously: poll until status is completed or failed. Failed jobs are refunded.</p>
      </section>
    </div>
  );
}
