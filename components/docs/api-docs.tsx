"use client";

import { useState } from "react";
import type { Model } from "@/lib/models";
import { CopyButton } from "@/components/docs/copy-button";

type Lang = "js" | "python" | "curl";

export function ApiDocs({ model }: { model: Model }) {
  const [lang, setLang] = useState<Lang>("js");

  const ar = model.aspectRatios[0];
  const res = model.popularResolutions[0] || model.resolutions[0];
  const dur = model.durations[0];
  const id = `fluxion/${model.slug}`;

  const params: { name: string; type: string; req?: boolean; desc: string }[] = [
    { name: "prompt", type: "string", req: true, desc: "Text description of the shot." },
    ...(model.supports.image ? [{ name: "image_url", type: "string", desc: "Optional image to animate (image-to-video)." }] : []),
    { name: "duration", type: "integer", desc: `Seconds (${model.durations[0]}-${model.durations[model.durations.length - 1]}).` },
    { name: "aspect_ratio", type: "enum", desc: model.aspectRatios.join(", ") },
    { name: "resolution", type: "enum", desc: model.resolutions.join(", ") },
    ...(model.supports.audio ? [{ name: "audio", type: "boolean", desc: "Generate a soundtrack." }] : []),
    ...(model.supports.seed ? [{ name: "seed", type: "integer", desc: "Seed for reproducible output." }] : []),
  ];

  const snippets: Record<Lang, string> = {
    js: `import { fluxion } from "@fluxion-ai/client";

fluxion.config({ credentials: process.env.FLUXION_API_KEY });

const result = await fluxion.run("${id}", {
  input: {
    prompt: "A cinematic aerial shot at golden hour",
    duration: ${dur},
    aspect_ratio: "${ar}",
    resolution: "${res}",
  },
});

console.log(result.video.url);`,
    python: `import fluxion

fluxion.api_key = os.environ["FLUXION_API_KEY"]

result = fluxion.run("${id}", input={
    "prompt": "A cinematic aerial shot at golden hour",
    "duration": ${dur},
    "aspect_ratio": "${ar}",
    "resolution": "${res}",
})

print(result["video"]["url"])`,
    curl: `curl -X POST https://api.fluxion-sys.ai/v1/${id} \\
  -H "Authorization: Key $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "prompt": "A cinematic aerial shot at golden hour",
      "duration": ${dur},
      "aspect_ratio": "${ar}",
      "resolution": "${res}"
    }
  }'`,
  };

  const response = `{
  "video": {
    "url": "https://cdn.fluxion-sys.ai/outputs/${model.slug}-9f3a.mp4",
    "duration": ${dur},
    "resolution": "${res}"
  },
  "seed": 812043,
  "timings": { "inference": 8.4 }
}`;

  const langLabel: Record<Lang, string> = { js: "JavaScript", python: "Python", curl: "cURL" };

  return (
    <div className="max-w-3xl">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-gold">API</span>
      <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">
        {model.name} API
      </h1>
      <p className="mt-2 text-sm text-muted">
        Call this model over HTTP. Endpoint id:{" "}
        <code className="rounded bg-raised px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-gold-2">{id}</code>
      </p>

      {/* auth */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">1. Authenticate</h2>
        <p className="mt-2 text-sm text-muted">
          Create a key in your dashboard and set it as an environment variable:
        </p>
        <div className="relative mt-3">
          <CopyButton text={'export FLUXION_API_KEY="sk-fluxion-xxxxxxxxxxxx"'} />
          <pre className="overflow-x-auto rounded-[10px] border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm text-fg">
            <code>export FLUXION_API_KEY=&quot;sk-fluxion-xxxxxxxxxxxx&quot;</code>
          </pre>
        </div>
      </section>

      {/* request */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">2. Run the model</h2>
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
        <p className="mt-3 text-xs text-dim">Illustrative only. No live API here.</p>
      </section>
    </div>
  );
}
