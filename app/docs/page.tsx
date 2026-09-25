import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { CopyButton } from "@/components/docs/copy-button";
import { LibraryDocs } from "@/components/docs/library-docs";
import { ModelDocs } from "@/components/docs/model-docs";

export const metadata = { title: "Documentation" };

// `body` mirrors the prose of each section (keywords only) so the sidebar can
// search doc *content*, not just titles. Keep it roughly in sync with the
// matching <section> below.
const NAV: { group: string; items: { id: string; label: string; body?: string }[] }[] = [
  {
    group: "Getting started",
    items: [
      { id: "introduction", label: "Introduction", body: "fluxion turns text and images into video pick a model describe the shot set duration aspect ratio resolution generate playground or http api" },
      { id: "quickstart", label: "Quickstart", body: "store an image asset submit a job poll it minimax h3 fast reference_image required prompt seconds resolution aspect_ratio video url curl" },
      { id: "authentication", label: "Authentication", body: "create a key in your dashboard pass it as an environment variable FLUXION_API_KEY never ship a key in client-side code rotate keys" },
    ],
  },
  {
    group: "Models",
    items: [
      { id: "models", label: "Overview", body: "each model has its own strengths supported durations resolutions per-second pricing browse the model catalog" },
      { id: "model-reference-video", label: "Video models", body: "what each video model takes seconds resolution aspect ratio sound reference images video audio time budget price per second curl example seedance minimax h3 fast wan asynchronous submit poll webhook" },
      { id: "model-reference-image", label: "Image models", body: "what each image model takes size megapixels input image price per image seedream synchronous one call no polling curl example" },
      { id: "generating", label: "Generating video", body: "send a prompt and options response includes the output video url and timing longer clips and higher resolutions cost more dollars per second curl post" },
      { id: "generating-images", label: "Generating images", body: "image generation text to image image to image seedream size megapixels one call no polling synchronous watermark n not supported input image charged response_format b64_json url expires archived library" },
      { id: "parameters", label: "Parameters", body: "prompt image_url duration aspect_ratio resolution image-to-video required seconds of output size image watermark" },
    ],
  },
  {
    group: "Your files",
    items: [
      { id: "how-files-work", label: "Assets: three calls", body: "create list delete asset upload a file id name type portrait multipart form data v1 assets curl reuse images video audio" },
      { id: "portraits", label: "Portraits", body: "register an image as a character reusable consistent face real person consent deepfake review provider preparing ready failed quota portrait_status" },
      { id: "references", label: "Using an asset in a generation", body: "reference field pass it to v1 videos metadata reference_image asset:// permanent signed link expires image 1 video 1 audio 1 order position prompt" },
    ],
  },
  {
    group: "Webhooks",
    items: [
      { id: "webhooks", label: "Getting called back", body: "webhook url callback instead of polling video completed video failed event type data id status content one request rather than seventeen every model https public address" },
      { id: "webhook-verify", label: "Verifying a callback", body: "signature hmac sha256 secret whsec timestamp raw body constant time compare replay tolerance rotate x-fluxion-signature x-fluxion-timestamp x-fluxion-delivery duplicate at least once idempotent" },
      { id: "webhook-delivery", label: "When one does not arrive", body: "deliveries endpoint state waiting delivered abandoned attempts retries exponential jitter 24 hours redeliver change url endpoints paused circuit breaker last_error" },
      { id: "webhook-deadline", label: "Working to a deadline", body: "generation_time_budget_s time budget end to end 3.5 seconds latency callback reuse a reference measured ultrafast plan a clip against a deadline" },
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
              MiniMax-H3-Fast follows material you give it rather than inventing a scene from words, so a
              generation starts with an image or a clip. Store one, then submit and poll.
            </p>
            <Code>{`# 1. Store an image. The response carries a reference to use below.
curl -sS https://api.fluxion-sys.ai/v1/assets \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -F file=@start.jpg
# -> {"id":"0a7304de…","type":"image","reference":"$REFERENCE_0A7304DE", …}

# 2. Submit; the response carries the video id.
curl -sS -X POST https://api.fluxion-sys.ai/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3-Fast",
    "prompt": "A slow push in on the scene in Image 1, golden hour",
    "seconds": 6,
    "resolution": "768P",
    "aspect_ratio": "16:9",
    "metadata": { "reference_image": ["$REFERENCE_0A7304DE"] }
  }'

# 3. Poll until "status": "completed", then download the MP4.
curl -sS https://api.fluxion-sys.ai/v1/videos/$VIDEO_ID \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

curl -sS -L -o out.mp4 https://api.fluxion-sys.ai/v1/videos/$VIDEO_ID/content \\
  -H "Authorization: Bearer $FLUXION_API_KEY"`}</Code>
            <p className="text-xs text-dim">
              Not every model needs a reference — each model&apos;s own page says whether it does, and the
              ones that generate from a prompt alone take the same request without the{" "}
              <code className="text-gold-2">metadata</code> block.
            </p>
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
            <H id="model-reference">Per-model reference</H>
            <p className="text-muted">
              What each model takes, and what a second of it costs. This is read from the catalogue as your account
              sees it, so it lists exactly the models you can generate with - including any you have early access to.
            </p>
            <ModelDocs />
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
              You do not have to keep asking. Add a <code className="text-gold-2">webhook</code> to the request and we
              will call you once it is done — see{" "}
              <Link href="#webhooks" className="text-blue hover:text-gold-soft">Getting called back</Link>. If you do
              poll, poll about twice a second; there is nothing to gain above that, and our own example once suggested
              eight times a second, which was our mistake.
            </p>
            <p className="text-muted">
              For image-to-video, pass <code className="text-gold-2">image_url</code>, or post the same fields as
              <code className="text-gold-2"> multipart/form-data</code> with an <code className="text-gold-2">image</code> part.
              Longer clips and higher resolutions cost more.
            </p>
          </section>

          <section className="space-y-3">
            <H id="webhooks">Getting called back</H>
            <p className="text-muted">
              Add a <code className="text-gold-2">webhook</code> to any generation and we will POST to it once the
              job finishes, instead of you asking whether it has. Works on every video model. The submit response is
              unchanged — an id, and <code className="text-gold-2">&quot;status&quot;: &quot;queued&quot;</code>.
            </p>
            <Code>{`curl -sS -X POST https://api.fluxion-sys.ai/v1/videos \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "MiniMax-H3-Fast",
    "prompt": "A slow push in on the scene in Image 1, golden hour",
    "seconds": 5,
    "metadata": {"reference_image": ["$REFERENCE_0A7304DE"]},
    "webhook": "https://your-service.example.com/hooks/fluxion"
  }'`}</Code>
            <p className="text-muted">
              Your URL must be https and must resolve to a public address. It is checked when you submit, so a typo
              is a <code className="text-gold-2">400</code> on the generation rather than a callback that never
              comes.
            </p>
            <p className="text-muted">What arrives:</p>
            <Code>{`POST /hooks/fluxion
X-Fluxion-Event: video.completed
X-Fluxion-Delivery: 9f2c1d8a4b6e5f70a1b2c3d4e5f60718
X-Fluxion-Timestamp: 1790319372
X-Fluxion-Signature: v1=361d09af770274eb9...
X-Fluxion-Attempt: 1

{
  "id": "evt_4f1c...",
  "type": "video.completed",
  "created_at": 1790319372,
  "data": {
    "id": "task_EbiFlqOdlvoxQ0CmFd2jzT4jbE0dKWWU",
    "object": "video",
    "status": "completed",
    "model": "MiniMax-H3-Fast",
    "seconds": 5,
    "resolution": "768P",
    "content": "/v1/videos/task_EbiFlqOdlvoxQ0CmFd2jzT4jbE0dKWWU/content"
  }
}`}</Code>
            <p className="text-muted">
              <code className="text-gold-2">type</code> is <code className="text-gold-2">video.completed</code> or{" "}
              <code className="text-gold-2">video.failed</code>; a failure carries{" "}
              <code className="text-gold-2">error</code> and no <code className="text-gold-2">content</code>.
            </p>
            <p className="text-muted">
              <strong className="text-fg">The callback carries no link to the video.</strong> It tells you the clip
              exists and where to ask for it; the bytes are still{" "}
              <code className="text-gold-2">GET /v1/videos/&#123;id&#125;/content</code> with your key. That is
              deliberate — a callback body ends up in your logs, your queue and your error tracker, and a URL that
              downloads your video without a credential does not belong in any of those. You are trading a poll loop
              for one authenticated request, not for zero.
            </p>
            <p className="text-muted">
              Measured on MiniMax-H3-Fast, twenty clips: the callback went out <strong className="text-fg">4.38 s</strong>{" "}
              after the submit call started, against <strong className="text-fg">4.73 s</strong> for polling twice a
              second — and used one request instead of 6.6. On models that take minutes the difference is the whole
              integration rather than a third of a second: callers waiting on Seedance-2.5 were averaging 95 status
              requests per generation.
            </p>
          </section>

          <section className="space-y-3">
            <H id="webhook-verify">Verifying a callback</H>
            <p className="text-muted">
              Anyone who learns your callback URL can POST to it, so check the signature before you trust the body.
              Your signing secret is per account:
            </p>
            <Code>{`curl -sS https://api.fluxion-sys.ai/v1/webhooks/secret \\
  -H "Authorization: Bearer $FLUXION_API_KEY"
# -> {"secret":"whsec_...","algorithm":"hmac-sha256",
#     "signed_material":"<x-fluxion-timestamp>.<raw request body>"}`}</Code>
            <Code>{`import hashlib, hmac, time

def verify(secret, body: bytes, timestamp: str, signature: str, tolerance=300):
    if abs(time.time() - int(timestamp)) > tolerance:
        return False                      # too old to accept
    expected = "v1=" + hmac.new(
        secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)`}</Code>
            <p className="text-muted">
              HMAC-SHA256 over the timestamp, a literal <code className="text-gold-2">.</code>, and{" "}
              <strong className="text-fg">the exact bytes of the body</strong> — a re-serialisation of the parsed JSON
              will not match. Use a constant-time compare, and keep the tolerance check: the timestamp is inside the
              signed material, so a captured body cannot be re-signed with a fresh one, but rejecting old timestamps
              closes the window for replaying it with its original one.{" "}
              <code className="text-gold-2">POST /v1/webhooks/secret/rotate</code> issues a new secret and
              invalidates the old one immediately.
            </p>
            <p className="text-muted">
              <strong className="text-fg">You may see an event twice.</strong> A delivery that times out after your
              handler committed is indistinguishable from one that never arrived, so we retry it.{" "}
              <code className="text-gold-2">X-Fluxion-Delivery</code> is the same for every attempt at the same
              event — store it and ignore one you have already handled. Answer{" "}
              <code className="text-gold-2">2xx</code> as soon as you have the event and do your work afterwards; your
              endpoint has ten seconds.
            </p>
          </section>

          <section className="space-y-3">
            <H id="webhook-delivery">When one does not arrive</H>
            <p className="text-muted">
              Every attempt is recorded, including your endpoint&apos;s own answer, so most questions about a missing
              callback are answerable without asking us.
            </p>
            <Code>{`curl -sS https://api.fluxion-sys.ai/v1/webhooks/deliveries \\
  -H "Authorization: Bearer $FLUXION_API_KEY"
# -> {"deliveries":[{"task_id":"task_...","state":"waiting","attempts":3,
#      "event":"video.completed","last_status":502,
#      "last_error":"the endpoint answered 502 with an empty body",
#      "next_attempt_at":"2026-09-25T19:17:01Z","delivered_at":null}]}`}</Code>
            <p className="text-muted">
              <code className="text-gold-2">state</code> is <code className="text-gold-2">waiting</code>,{" "}
              <code className="text-gold-2">delivered</code>, or <code className="text-gold-2">abandoned</code>.
              Retries are exponential with jitter — 5s, 10s, 20s, doubling to an hour —{" "}
              <strong className="text-fg">for 24 hours</strong>. Anything outside 2xx is a failure, including a 3xx:
              redirects are not followed.
            </p>
            <p className="text-muted">
              If you were down longer than that, ask again. This works from any state, including{" "}
              <code className="text-gold-2">delivered</code> — if you lost the event on your side, ask rather than
              reconstruct:
            </p>
            <Code>{`# send it again; the 24 hour window starts over
curl -sS -X POST https://api.fluxion-sys.ai/v1/webhooks/deliveries/task_.../redeliver \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

# or point it somewhere else and retry in one call
curl -sS -X PUT https://api.fluxion-sys.ai/v1/webhooks/deliveries/task_.../url \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H "Content-Type: application/json" \\
  -d '{"url":"https://your-new-host.example.com/hooks/fluxion"}'`}</Code>
            <p className="text-muted">
              If a host of yours stops answering entirely we pause on it for a while rather than keep attempting every
              queued callback against it — a minute at first, doubling to at most half an hour.{" "}
              <code className="text-gold-2">GET /v1/webhooks/endpoints</code> shows whether that has happened, which
              is worth knowing because &ldquo;we stopped calling you&rdquo; and &ldquo;your generations stopped
              finishing&rdquo; look identical from your side. Asking for a redelivery clears the pause. Pauses consume
              no attempts and do not extend the 24 hours.
            </p>
            <p className="text-muted">
              <strong className="text-fg">Nothing is lost while you are down.</strong> A callback is a convenience,
              not the record: the clip is stored and{" "}
              <code className="text-gold-2">GET /v1/videos/&#123;id&#125;</code> returns it for as long as you keep
              it, whether or not a callback ever arrived.
            </p>
          </section>

          <section className="space-y-3">
            <H id="webhook-deadline">Working to a deadline</H>
            <p className="text-muted">
              A callback removes the poll loop but not the wait. Where a model offers{" "}
              <code className="text-gold-2">metadata.generation_time_budget_s</code> — the per-model reference above
              says which — you can also cap the generation itself, and the two together let you hold a round trip to
              a deadline. The budget is a planning target, not a hard stop: the clip is planned to fit it, working
              from less of your reference detail at the same length and size, and a budget that cannot be met is
              refused with the smallest one that can. The price is the same either way.
            </p>
            <p className="text-muted">
              The budget covers generation only — not the submit call, the queue, or the notification. Measured, with
              one reference reused so the provider already holds it: a budget of{" "}
              <code className="text-gold-2">3.0</code> gave <strong className="text-fg">3.14–3.34 s</strong> from
              submit to callback. Roughly, <em>budget ≈ your target − 0.5 s</em>, and measure it against your own
              deadline rather than trusting the arithmetic.
            </p>
            <Code>{`{
  "model": "MiniMax-H3-UltraFast",
  "prompt": "A slow push in on the scene in Image 1",
  "seconds": 5,
  "metadata": {
    "reference_image": ["$REFERENCE_0A7304DE"],
    "generation_time_budget_s": 3.0
  },
  "webhook": "https://your-service.example.com/hooks/fluxion"
}`}</Code>
            <p className="text-muted">
              Two things matter as much as the budget. <strong className="text-fg">Reuse a reference</strong> rather
              than uploading a new one per request — the provider fetches an image it has not seen before during your
              submit call, which cost 0.3&nbsp;s of the first request and nothing on the ones after it. And{" "}
              <strong className="text-fg">keep your handler fast</strong>: acknowledge, then work.
            </p>
          </section>

          <section className="space-y-3">
            <H id="generating-images">Generating images</H>
            <p className="text-muted">
              An image is not a job. <code className="text-gold-2">POST /v1/images/generations</code> holds open for
              the seconds the render takes and returns the picture, so there is nothing to poll and no id to poll it
              with. The route is OpenAI-shaped, so an existing images client works by pointing it here.
            </p>
            <p className="text-muted">
              <code className="text-gold-2">size</code> is the shape as well as the resolution
              (&ldquo;2048x1152&rdquo;) — there is no separate aspect ratio. For image-to-image, pass{" "}
              <code className="text-gold-2">image</code>: one value or a list, each a public https URL, a{" "}
              <code className="text-gold-2">data:</code> URI, or the <code className="text-gold-2">reference</code>{" "}
              of one of your assets. On models that charge for inputs, the first is free and the rest are billed
              per image; the per-model reference above gives the figures.
            </p>
            <p className="text-muted">
              Two defaults worth knowing. The provider would mark the corner &ldquo;AI generated&rdquo;; we send{" "}
              <code className="text-gold-2">watermark: false</code> unless your request says otherwise, exactly as
              for video. And the <code className="text-gold-2">url</code> that comes back is the provider&apos;s own
              and expires — every image is also kept in your own storage and appears under Library, so that URL is
              never the only copy. Ask for <code className="text-gold-2">&quot;response_format&quot;:
              &quot;b64_json&quot;</code> to get the bytes inline instead.
            </p>
            <p className="text-muted">
              One image per request: <code className="text-gold-2">n</code> above 1 is refused rather than silently
              ignored, because this provider makes one picture per call.
            </p>
          </section>

          <section className="space-y-3">
            <H id="parameters">Parameters</H>
            <ul className="space-y-2 text-sm text-muted">
              <li><code className="text-gold-2">prompt</code>, text description of the shot (required).</li>
              <li><code className="text-gold-2">image_url</code>, optional image to animate (image-to-video).</li>
              <li><code className="text-gold-2">seconds</code>, clip length; each model lists the values it accepts.</li>
              <li><code className="text-gold-2">aspect_ratio</code>, e.g. 16:9, 9:16, 1:1.</li>
              <li><code className="text-gold-2">resolution</code>, per model; each model&apos;s page lists the ones it accepts.</li>
              <li><code className="text-gold-2">audio</code>, generate sound, on models that support it.</li>
              <li><code className="text-gold-2">seed</code>, for reproducible output, on models that support it.</li>
            </ul>
            <p className="text-sm text-muted">
              Image generation takes a different set: <code className="text-gold-2">prompt</code>,{" "}
              <code className="text-gold-2">size</code>, <code className="text-gold-2">image</code>,{" "}
              <code className="text-gold-2">response_format</code>, <code className="text-gold-2">watermark</code>{" "}
              and <code className="text-gold-2">seed</code>. There is no duration, no aspect ratio and no audio.
            </p>
          </section>

          <section className="space-y-3">
            <H id="assets">Assets</H>
            <p className="text-muted">
              Files you store with us and reuse. Three calls, and the same objects the Library page shows —
              so whatever you build sees exactly what you see.
            </p>
            <LibraryDocs />
          </section>

          <section className="space-y-3">
            <H id="api">API reference</H>
            <p className="text-muted">
              Video models share one endpoint, <code className="text-gold-2">/v1/videos</code>, and image models
              share <code className="text-gold-2">/v1/images/generations</code>; either way the model is selected with
              the request&apos;s <code className="text-gold-2">model</code> field. See the per-model reference, with its
              exact sizes, durations and pricing, from any model&apos;s playground under the API tab.
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
