"use client";

import { useState } from "react";
import type { Model } from "@/lib/models";

type Lang = "js" | "python" | "curl";

export function ApiDocs({ model }: { model: Model }) {
  const [lang, setLang] = useState<Lang>("js");
  const [copied, setCopied] = useState(false);

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

  function copy() {
    navigator.clipboard?.writeText(snippets[lang]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  const langLabel: Record<Lang, string> = { js: "JavaScript", python: "Python", curl: "cURL" };

  return (
    <div className="max-w-3xl">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#E0A24E]">API</span>
      <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.01em]">
        {model.name} API
      </h1>
      <p className="mt-2 text-sm text-[#9FB2CC]">
        Call this model over HTTP. Endpoint id:{" "}
        <code className="rounded bg-[#101E36] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[#FFC15E]">{id}</code>
      </p>

      {/* auth */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#C7D4E6]">1. Authenticate</h2>
        <p className="mt-2 text-sm text-[#9FB2CC]">
          Create a key in your dashboard and set it as an environment variable:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-[10px] border border-[#33507C] bg-[#0B1524] p-4 font-[family-name:var(--font-jetbrains)] text-sm text-[#E9F1FB]">
          <code>export FLUXION_API_KEY=&quot;sk-fluxion-xxxxxxxxxxxx&quot;</code>
        </pre>
      </section>

      {/* request */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#C7D4E6]">2. Run the model</h2>
          <button onClick={copy} className="rounded-[8px] border border-[rgba(124,189,242,0.24)] px-3 py-1 text-xs text-[#9FB2CC] transition-colors hover:text-[#FF8A1E]">
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <div className="mt-3 flex gap-4 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
          {(["js", "python", "curl"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`pb-1 transition-colors ${lang === l ? "border-b border-[#FF8A1E] text-[#FF8A1E]" : "text-[#9FB2CC] hover:text-[#E9F1FB]"}`}
            >
              {langLabel[l]}
            </button>
          ))}
        </div>
        <pre className="mt-3 overflow-x-auto rounded-[10px] border border-[#33507C] bg-[#0B1524] p-4 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-[#E9F1FB]">
          <code>{snippets[lang]}</code>
        </pre>
      </section>

      {/* input schema */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#C7D4E6]">Input parameters</h2>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-[#33507C]">
          <table className="w-full text-left text-sm">
            <thead className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-[#9FB2CC]">
              <tr className="border-b border-[#33507C]">
                <th className="px-4 py-2.5">Field</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name} className="border-b border-[rgba(124,189,242,0.12)] last:border-0 align-top">
                  <td className="px-4 py-2.5 font-[family-name:var(--font-jetbrains)] text-[#FFC15E]">
                    {p.name}{p.req && <span className="text-[#FF6B6B]"> *</span>}
                  </td>
                  <td className="px-4 py-2.5 text-[#9FB2CC]">{p.type}</td>
                  <td className="px-4 py-2.5 text-[#C7D4E6]">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[#6E82A0]"><span className="text-[#FF6B6B]">*</span> required</p>
      </section>

      {/* response */}
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#C7D4E6]">Response</h2>
        <pre className="mt-3 overflow-x-auto rounded-[10px] border border-[#33507C] bg-[#0B1524] p-4 font-[family-name:var(--font-jetbrains)] text-sm text-[#E9F1FB]">
          <code>{response}</code>
        </pre>
        <p className="mt-3 text-xs text-[#6E82A0]">Illustrative only. This demo has no live API.</p>
      </section>
    </div>
  );
}
