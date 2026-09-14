import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { CopyButton } from "@/components/docs/copy-button";

export const metadata = { title: "Documentation" };

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
      { id: "generating", label: "Generating video", body: "send a prompt and options response includes the output video url and timing longer clips and higher resolutions cost more dollars per second curl post" },
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
      { id: "billing", label: "Billing", body: "pay per second of generated video in dollars priced per model and resolution balance never expires" },
      { id: "keys", label: "API keys", body: "generate name and revoke keys from your account treat keys like passwords" },
    ],
  },
];

function Code({ children }: { children: string }) {
  return (
    <div className="relative mt-3">
      <CopyButton text={children} />
      <pre className="overflow-x-auto border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
        <code>{children}</code>
      </pre>
    </div>
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
              Two HTTP calls: submit a job, then poll it until the video is ready. No SDK required.
            </p>
            <Code>{`# Submit; the response carries the video id.
curl -X POST https://api.fluxion-sys.ai/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3",
    "prompt": "A cinematic aerial shot at golden hour",
    "seconds": 6,
    "resolution": "768P",
    "aspect_ratio": "16:9"
  }'

# Poll until "status": "completed", then download the MP4.
curl https://api.fluxion-sys.ai/v1/videos/$VIDEO_ID \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

curl -L -o out.mp4 https://api.fluxion-sys.ai/v1/videos/$VIDEO_ID/content \\
  -H "Authorization: Bearer $FLUXION_API_KEY"`}</Code>
          </section>

          <section className="space-y-3">
            <H id="authentication">Authentication</H>
            <p className="text-muted">
              Create a key under{" "}
              <Link href="/profile?tab=keys" className="text-blue hover:text-gold-soft">Profile → API keys</Link>{" "}
              and send it as a bearer token on every request:
            </p>
            <Code>{`export FLUXION_API_KEY="sk-xxxxxxxxxxxxxxxxxxxx"`}</Code>
            <p className="text-muted">
              Never ship a key in client-side code. Keys spend your balance, so rotate or revoke
              them from the same page if one leaks.
            </p>
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
              Generation is asynchronous. <code className="text-gold-2">POST /v1/videos</code> holds the cost and
              returns a video id with <code className="text-gold-2">&quot;status&quot;: &quot;queued&quot;</code>;
              <code className="text-gold-2"> GET /v1/videos/&#123;id&#125;</code> reports progress until it is{" "}
              <code className="text-gold-2">completed</code> or <code className="text-gold-2">failed</code>;
              <code className="text-gold-2"> GET /v1/videos/&#123;id&#125;/content</code> streams the MP4 and honours
              Range requests. A failed job returns what it held.
            </p>
            <p className="text-muted">
              For image-to-video, pass <code className="text-gold-2">image_url</code>, or post the same fields as
              <code className="text-gold-2"> multipart/form-data</code> with an <code className="text-gold-2">image</code> part.
              Longer clips and higher resolutions cost more.
            </p>
          </section>

          <section className="space-y-3">
            <H id="parameters">Parameters</H>
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-gold-2">prompt</code>, text description of the shot (required).</li>
              <li><code className="text-gold-2">image_url</code>, optional image to animate (image-to-video).</li>
              <li><code className="text-gold-2">seconds</code>, clip length; each model lists the values it accepts.</li>
              <li><code className="text-gold-2">aspect_ratio</code>, e.g. 16:9, 9:16, 1:1.</li>
              <li><code className="text-gold-2">resolution</code>, per model, e.g. 768P or 2K on MiniMax H3.</li>
              <li><code className="text-gold-2">audio</code>, generate sound, on models that support it.</li>
              <li><code className="text-gold-2">seed</code>, for reproducible output, on models that support it.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="api">API reference</H>
            <p className="text-muted">
              Every model shares one endpoint, <code className="text-gold-2">/v1/videos</code>, and is selected with the
              request&apos;s <code className="text-gold-2">model</code> field. See the per-model reference, with its exact
              durations, resolutions and pricing, from any model&apos;s playground under the API tab.
            </p>
          </section>

          <section className="space-y-3">
            <H id="rate-limits">Rate limits</H>
            <p className="text-muted">
              Requests are limited per account. Bursting returns HTTP 429 with a{" "}
              <code className="text-gold-2">Retry-After</code> hint; retry with exponential backoff. Poll a job every
              few seconds rather than in a tight loop.
            </p>
          </section>

          <section className="space-y-3">
            <H id="errors">Errors</H>
            <p className="text-muted">
              Errors come back as <code className="text-gold-2">&#123; &quot;error&quot;: &#123; &quot;message&quot;, &quot;type&quot;, &quot;code&quot; &#125; &#125;</code>{" "}
              with a request id in the message, which is worth logging.
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-danger">400</code>, invalid parameters, e.g. a resolution the model does not support.</li>
              <li><code className="text-danger">401</code>, missing or invalid API key.</li>
              <li><code className="text-danger">403</code>, not enough credits for the request.</li>
              <li><code className="text-danger">429</code>, rate limited.</li>
              <li><code className="text-danger">503</code>, no capacity for that model right now; retry shortly.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <H id="billing">Billing</H>
            <p className="text-muted">
              Pay per second of generated video, priced per model and resolution. Credits are held when a job is
              submitted and returned if it fails. Top up and set a low-balance alert from{" "}
              <Link href="/profile?tab=billing" className="text-blue hover:text-gold-soft">Billing</Link>. Credits never expire.
            </p>
          </section>

          <section className="space-y-3">
            <H id="keys">API keys</H>
            <p className="text-muted">
              Create, name, and revoke keys under{" "}
              <Link href="/profile?tab=keys" className="text-blue hover:text-gold-soft">Profile → API keys</Link>, where each
              one also shows when it was last used and how much it has spent. Treat keys like passwords: they spend
              your credits.
            </p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
