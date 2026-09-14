import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocsSidebar } from "@/components/docs-sidebar";
import { CopyButton } from "@/components/copy-button";

export const metadata = { title: "Documentation" };

// `body` mirrors the prose of each section (keywords only) so the sidebar can
// search doc *content*, not just titles. Keep it roughly in sync with the
// matching <section> below.
const NAV: { group: string; items: { id: string; label: string; body?: string }[] }[] = [
  {
    group: "Getting started",
    items: [
      { id: "introduction", label: "Introduction", body: "fluxion turns text and images into video pick a model describe the shot set duration aspect ratio resolution generate playground or http api" },
      { id: "quickstart", label: "Quickstart", body: "generation is asynchronous start a job poll until it finishes download the mp4 fetch post v1 videos aurora prompt seconds aspect_ratio resolution" },
      { id: "authentication", label: "Authentication", body: "create a key in your dashboard send it as a bearer token authorization FLUXION_API_KEY never ship a key in client-side code rotate keys" },
    ],
  },
  {
    group: "Models",
    items: [
      { id: "models", label: "Overview", body: "each model has its own strengths supported durations resolutions per-second pricing browse the model catalog" },
      { id: "generating", label: "Generating video", body: "post v1 videos starts a job poll status completed failed download content credits reserved refunded longer clips higher resolutions cost more curl aurora" },
      { id: "parameters", label: "Parameters", body: "model prompt seconds aspect_ratio resolution audio seed image image-to-video multipart url data url required" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "api", label: "API reference", body: "every model uses the same endpoints the model field picks the model per-model reference api tab" },
      { id: "rate-limits", label: "Rate limits", body: "requests are limited per key bursting beyond your tier returns http 429 retry with backoff" },
      { id: "errors", label: "Errors", body: "400 invalid parameters message names the field 401 missing or invalid api key 403 not enough credits 429 rate limited" },
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
            <p className="text-muted">
              Generation is asynchronous: start a job, poll it until it finishes, then download the MP4. No SDK needed:
            </p>
            <Code>{`const API = "https://api.fluxion-sys.ai";
const headers = {
  Authorization: \`Bearer \${process.env.FLUXION_API_KEY}\`,
  "Content-Type": "application/json",
};

// 1. Start a job
let video = await fetch(\`\${API}/v1/videos\`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model: "aurora",
    prompt: "A cinematic aerial shot at golden hour",
    seconds: 6,
    aspect_ratio: "16:9",
    resolution: "720p",
  }),
}).then((r) => r.json());

// 2. Poll until it finishes
while (video.status === "queued" || video.status === "in_progress") {
  await new Promise((r) => setTimeout(r, 5000));
  video = await fetch(\`\${API}/v1/videos/\${video.id}\`, { headers }).then((r) => r.json());
}

// 3. Download the MP4
const mp4 = await fetch(\`\${API}/v1/videos/\${video.id}/content\`, { headers });`}</Code>
          </section>

          <section className="space-y-3">
            <H id="authentication">Authentication</H>
            <p className="text-muted">Create a key in your dashboard and send it as a bearer token:</p>
            <Code>{`export FLUXION_API_KEY="sk-xxxxxxxxxxxxxxxx"
curl https://api.fluxion-sys.ai/v1/videos/VIDEO_ID -H "Authorization: Bearer $FLUXION_API_KEY"`}</Code>
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
              <code className="text-gold-2">POST /v1/videos</code> starts a job and returns its id. Poll{" "}
              <code className="text-gold-2">GET /v1/videos/{"{id}"}</code> until <code className="text-gold-2">status</code> is{" "}
              <code className="text-gold-2">completed</code> or <code className="text-gold-2">failed</code>, then download{" "}
              <code className="text-gold-2">GET /v1/videos/{"{id}"}/content</code>. Credits are reserved when the job starts and
              refunded if it fails. Longer clips and higher resolutions cost more.
            </p>
            <Code>{`curl -X POST https://api.fluxion-sys.ai/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "model": "aurora", "prompt": "Neon rain on a city street", "seconds": 6, "resolution": "720p" }'`}</Code>
          </section>

          <section className="space-y-3">
            <H id="parameters">Parameters</H>
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-gold-2">model</code> — model id: aurora, pulse, volt, or nova (required).</li>
              <li><code className="text-gold-2">prompt</code> — text description of the shot (required).</li>
              <li><code className="text-gold-2">seconds</code> — seconds of output, within the model&apos;s range.</li>
              <li><code className="text-gold-2">aspect_ratio</code> — e.g. 16:9, 9:16, 1:1.</li>
              <li><code className="text-gold-2">resolution</code> — 480p, 720p, or 1080p, as the model supports.</li>
              <li><code className="text-gold-2">audio</code> — generate a soundtrack, on models that support it.</li>
              <li><code className="text-gold-2">seed</code> — integer for reproducible output.</li>
              <li><code className="text-gold-2">image</code> — image to animate: an https URL or base64 data URL, or an <code className="text-gold-2">image</code> file in a multipart/form-data request.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="api">API reference</H>
            <p className="text-muted">
              Every model uses the same endpoints; the <code className="text-gold-2">model</code> field picks the model. See the
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
              <li><code className="text-danger">400</code> — invalid parameters; the message names the field.</li>
              <li><code className="text-danger">401</code> — missing or invalid API key.</li>
              <li><code className="text-danger">403</code> — not enough credits for the request; nothing is charged.</li>
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
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
