import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocsSidebar } from "@/components/docs-sidebar";
import { CopyButton } from "@/components/copy-button";

export const metadata = { title: "Documentation · Fluxion AI Video" };

// `body` mirrors the prose of each section (keywords only) so the sidebar can
// search doc *content*, not just titles. Keep it roughly in sync with the
// matching <section> below.
const NAV: { group: string; items: { id: string; label: string; body?: string }[] }[] = [
  {
    group: "Getting started",
    items: [
      { id: "introduction", label: "Introduction", body: "fluxion turns text and images into video pick a model describe the shot set duration aspect ratio resolution generate playground or http api" },
      { id: "quickstart", label: "Quickstart", body: "install the client npm install @fluxion-ai/client run your first generation fluxion.run aurora prompt duration aspect_ratio resolution video url" },
      { id: "authentication", label: "Authentication", body: "create a key in your dashboard pass it as an environment variable FLUXION_API_KEY never ship a key in client-side code rotate keys" },
    ],
  },
  {
    group: "Models",
    items: [
      { id: "models", label: "Overview", body: "each model has its own strengths supported durations resolutions per-second pricing browse the model catalog" },
      { id: "generating", label: "Generating video", body: "send a prompt and options response includes the output video url and timing longer clips and higher resolutions cost more credits curl post aurora" },
      { id: "parameters", label: "Parameters", body: "prompt image_url duration aspect_ratio resolution image-to-video required seconds of output" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "api", label: "API reference", body: "every model exposes the same request shape at fluxion model per-model reference api tab" },
      { id: "rate-limits", label: "Rate limits", body: "requests are limited per key bursting beyond your tier returns http 429 retry with backoff" },
      { id: "errors", label: "Errors", body: "401 missing or invalid api key 422 invalid parameters 429 rate limited" },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "billing", label: "Billing", body: "pay per second of generated video add credits and manage limits credits never expire" },
      { id: "keys", label: "API keys", body: "generate name and revoke keys from your account treat keys like passwords" },
    ],
  },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="relative mt-3 overflow-x-auto border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
      <CopyButton text={children} />
      <code>{children}</code>
    </pre>
  );
}

function H({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-xl font-medium uppercase tracking-[0.02em] text-fg">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        {/* shaded sidebar, ~1/4 of the screen, with search */}
        <DocsSidebar nav={NAV} />

        {/* content (id lets DocsSidebar highlight search matches in place) */}
        <main id="docs-content" className="min-w-0 max-w-3xl flex-1 space-y-12 px-10 py-10">
          <div>
            <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Documentation</span>
            <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">Fluxion docs</h1>
            <p className="mt-3 text-muted">Everything you need to generate video from a prompt, in the app or over the API.</p>
          </div>

          <section className="space-y-3">
            <H id="introduction">Introduction</H>
            <p className="text-muted">
              Fluxion turns text and images into video. Pick a model, describe the shot, set duration, aspect ratio, and
              resolution, then generate. You can work in the playground or call any model over HTTP.
            </p>
          </section>

          <section className="space-y-3">
            <H id="quickstart">Quickstart</H>
            <p className="text-muted">Install the client and run your first generation:</p>
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
            <p className="text-muted">Create a key in your dashboard and pass it as an environment variable:</p>
            <Code>{`export FLUXION_API_KEY="sk-fluxion-xxxxxxxxxxxx"`}</Code>
            <p className="text-muted">Never ship a key in client-side code. Rotate keys from the API keys page.</p>
          </section>

          <section className="space-y-3">
            <H id="models">Models overview</H>
            <p className="text-muted">
              Each model has its own strengths, supported durations, resolutions, and per-second pricing. Browse them in the{" "}
              <Link href="/models" className="text-blue hover:text-gold-soft">model catalog</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <H id="generating">Generating video</H>
            <p className="text-muted">
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
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-gold-2">prompt</code> — text description of the shot (required).</li>
              <li><code className="text-gold-2">image_url</code> — optional image to animate (image-to-video).</li>
              <li><code className="text-gold-2">duration</code> — seconds of output.</li>
              <li><code className="text-gold-2">aspect_ratio</code> — e.g. 16:9, 9:16, 1:1.</li>
              <li><code className="text-gold-2">resolution</code> — 480p, 720p, or 1080p.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="api">API reference</H>
            <p className="text-muted">
              Every model exposes the same request shape at <code className="text-gold-2">fluxion/&lt;model&gt;</code>. See the
              per-model reference from any model&apos;s playground under the API tab.
            </p>
          </section>

          <section className="space-y-3">
            <H id="rate-limits">Rate limits</H>
            <p className="text-muted">Requests are limited per key. Bursting beyond your tier returns HTTP 429; retry with backoff.</p>
          </section>

          <section className="space-y-3">
            <H id="errors">Errors</H>
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-danger">401</code> — missing or invalid API key.</li>
              <li><code className="text-danger">422</code> — invalid parameters.</li>
              <li><code className="text-danger">429</code> — rate limited.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="billing">Billing</H>
            <p className="text-muted">
              Pay per second of generated video. Add credits and manage limits from{" "}
              <Link href="/profile?tab=billing" className="text-blue hover:text-gold-soft">Billing</Link>. Credits never expire.
            </p>
          </section>

          <section className="space-y-3">
            <H id="keys">API keys</H>
            <p className="text-muted">Generate, name, and revoke keys from your account. Treat keys like passwords.</p>
            <p className="text-xs text-dim">Illustrative only. No live API here.</p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
