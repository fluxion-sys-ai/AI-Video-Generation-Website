import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Documentation · Fluxion AI Video" };

const NAV: { group: string; items: { id: string; label: string }[] }[] = [
  {
    group: "Getting started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quickstart" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    group: "Models",
    items: [
      { id: "models", label: "Overview" },
      { id: "generating", label: "Generating video" },
      { id: "parameters", label: "Parameters" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "api", label: "API reference" },
      { id: "rate-limits", label: "Rate limits" },
      { id: "errors", label: "Errors" },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "billing", label: "Billing" },
      { id: "keys", label: "API keys" },
    ],
  },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto border border-[#33507C] bg-[#0B1524] p-4 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-[#E9F1FB]">
      <code>{children}</code>
    </pre>
  );
}

function H({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-xl font-medium uppercase tracking-[0.02em] text-[#E9F1FB]">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-8 py-10">
        {/* sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-28 space-y-6">
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-[#6E82A0]">{g.group}</p>
                <ul className="mt-2 space-y-1">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <a href={`#${it.id}`} className="block py-1 text-sm text-[#9FB2CC] transition-colors hover:text-[#F5C46B]">
                        {it.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* content */}
        <main className="min-w-0 max-w-2xl flex-1 space-y-12">
          <div>
            <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">Documentation</span>
            <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">Fluxion docs</h1>
            <p className="mt-3 text-[#9FB2CC]">Everything you need to generate video from a prompt, in the app or over the API.</p>
          </div>

          <section className="space-y-3">
            <H id="introduction">Introduction</H>
            <p className="text-[#9FB2CC]">
              Fluxion turns text and images into video. Pick a model, describe the shot, set duration, aspect ratio, and
              resolution, then generate. You can work in the playground or call any model over HTTP.
            </p>
          </section>

          <section className="space-y-3">
            <H id="quickstart">Quickstart</H>
            <p className="text-[#9FB2CC]">Install the client and run your first generation:</p>
            <Code>{`npm install @fluxion-ai/client

import { fluxion } from "@fluxion-ai/client";

fluxion.config({ credentials: process.env.FLUXION_API_KEY });

const result = await fluxion.run("fluxion/aurora", {
  input: {
    prompt: "A cinematic aerial shot at golden hour",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "720p",
  },
});

console.log(result.video.url);`}</Code>
          </section>

          <section className="space-y-3">
            <H id="authentication">Authentication</H>
            <p className="text-[#9FB2CC]">Create a key in your dashboard and pass it as an environment variable:</p>
            <Code>{`export FLUXION_API_KEY="sk-fluxion-xxxxxxxxxxxx"`}</Code>
            <p className="text-[#9FB2CC]">Never ship a key in client-side code. Rotate keys from the API keys page.</p>
          </section>

          <section className="space-y-3">
            <H id="models">Models overview</H>
            <p className="text-[#9FB2CC]">
              Each model has its own strengths, supported durations, resolutions, and per-second pricing. Browse them in the{" "}
              <Link href="/models" className="text-[#7CBDF2] hover:text-[#F5C46B]">model catalog</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <H id="generating">Generating video</H>
            <p className="text-[#9FB2CC]">
              Send a prompt and options; the response includes the output video URL and timing. Longer clips and higher
              resolutions cost more credits.
            </p>
            <Code>{`curl -X POST https://api.fluxion-sys.ai/v1/fluxion/aurora \\
  -H "Authorization: Key $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "input": { "prompt": "Neon rain on a city street", "duration": 5 } }'`}</Code>
          </section>

          <section className="space-y-3">
            <H id="parameters">Parameters</H>
            <ul className="space-y-2 text-sm text-[#9FB2CC]">
              <li><code className="text-[#FFC15E]">prompt</code> — text description of the shot (required).</li>
              <li><code className="text-[#FFC15E]">image_url</code> — optional image to animate (image-to-video).</li>
              <li><code className="text-[#FFC15E]">duration</code> — seconds of output.</li>
              <li><code className="text-[#FFC15E]">aspect_ratio</code> — e.g. 16:9, 9:16, 1:1.</li>
              <li><code className="text-[#FFC15E]">resolution</code> — 480p, 720p, or 1080p.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="api">API reference</H>
            <p className="text-[#9FB2CC]">
              Every model exposes the same request shape at <code className="text-[#FFC15E]">fluxion/&lt;model&gt;</code>. See the
              per-model reference from any model&apos;s playground under the API tab.
            </p>
          </section>

          <section className="space-y-3">
            <H id="rate-limits">Rate limits</H>
            <p className="text-[#9FB2CC]">Requests are limited per key. Bursting beyond your tier returns HTTP 429; retry with backoff.</p>
          </section>

          <section className="space-y-3">
            <H id="errors">Errors</H>
            <ul className="space-y-2 text-sm text-[#9FB2CC]">
              <li><code className="text-[#FF6B6B]">401</code> — missing or invalid API key.</li>
              <li><code className="text-[#FF6B6B]">422</code> — invalid parameters.</li>
              <li><code className="text-[#FF6B6B]">429</code> — rate limited.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="billing">Billing</H>
            <p className="text-[#9FB2CC]">
              Pay per second of generated video. Add credits and manage limits from{" "}
              <Link href="/profile?tab=billing" className="text-[#7CBDF2] hover:text-[#F5C46B]">Billing</Link>. Credits never expire.
            </p>
          </section>

          <section className="space-y-3">
            <H id="keys">API keys</H>
            <p className="text-[#9FB2CC]">Generate, name, and revoke keys from your account. Treat keys like passwords.</p>
            <p className="text-xs text-[#6E82A0]">Illustrative only. No live API here.</p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
