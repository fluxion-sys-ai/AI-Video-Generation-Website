/**
 * The library management API, for the docs page.
 *
 * Kept beside the generation reference rather than under it, because the two
 * answer different questions. `/v1/videos` is "make me a video". These are
 * "what do I have, and how does a file I uploaded become an input to that".
 *
 * The one thing this has to get across is the order of operations: a file is
 * uploaded once and kept, and a separate call turns a stored file into the
 * links or references a generation takes. People expect to post a URL and are
 * surprised there is a step in between - so the step is the first thing said,
 * not a detail at the bottom.
 */

"use client";

import { useEffect, useState } from "react";
import { BACKEND_ENABLED } from "@/lib/hub";
import { CopyButton } from "@/components/docs/copy-button";

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

function Endpoints({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto border border-line">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <tbody>
          {rows.map(([route, what]) => (
            <tr key={route} className="border-b border-hairline last:border-0 align-top">
              <td className="whitespace-nowrap p-2.5 font-[family-name:var(--font-jetbrains)] text-[13px] text-gold-2">
                {route}
              </td>
              <td className="p-2.5 text-muted">{what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fields({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="mt-3 overflow-x-auto border border-line">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line-strong bg-surface/60 text-left font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-dim">
            <th className="p-2.5">Field</th>
            <th className="p-2.5">Type</th>
            <th className="p-2.5">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, desc]) => (
            <tr key={name} className="border-b border-hairline last:border-0 align-top">
              <td className="whitespace-nowrap p-2.5 font-[family-name:var(--font-jetbrains)] text-[13px] text-gold-2">{name}</td>
              <td className="whitespace-nowrap p-2.5 font-[family-name:var(--font-jetbrains)] text-[12px] text-dim">{type}</td>
              <td className="p-2.5 text-muted">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FALLBACK_HOST = "https://api.fluxion-sys.ai";

export function LibraryDocs() {
  // The origin the reader is actually on, so a copied curl works as pasted.
  //
  // Set after mount rather than read during render. This site is a static
  // export, so the HTML is built once with no window in sight; reading
  // window.location during render would make the browser's first render
  // disagree with that HTML, which is a hydration mismatch. The documented
  // pattern is to render the neutral value and correct it once mounted.
  const [host, setHost] = useState(FALLBACK_HOST);
  useEffect(() => {
    if (BACKEND_ENABLED) setHost(window.location.origin);
  }, []);
  return (
    <div className="space-y-10">
      <div>
        <h3
          id="how-files-work"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          Three calls
        </h3>
        <p className="mt-2 text-muted">
          An asset is a file you store with us and reuse: an image, a clip, a piece of audio. Upload it once,
          then name it in as many generations as you like.
        </p>
        <Endpoints
          rows={[
            ["POST /v1/assets", "Store a file. Returns its id."],
            ["GET /v1/assets", "What you have: id, name, type, whether it is a portrait."],
            ["DELETE /v1/assets/{id}", "Remove it, here and at the video provider."],
          ]}
        />
        <p className="mt-4 text-muted">
          Creating takes <code className="text-gold-2">multipart/form-data</code>. Only{" "}
          <code className="text-gold-2">file</code> is required.
        </p>
        <Fields
          rows={[
            ["file", "binary", "The image, video or audio file."],
            ["name", "string", "What to call it. Defaults to the filename."],
            ["portrait", "enum", "virtual or person — register an image as a reusable character. Images only."],
          ]}
        />
        <Code>{`curl -sS ${host}/v1/assets \
  -H "Authorization: Bearer $FLUXION_API_KEY" \
  -F file=@lead-singer.jpg -F name="Ana"

{
  "id": "0a7304deacbf42e6bc8d908d6c67ba8d",
  "name": "Ana",
  "type": "image",
  "bytes": 184213,
  "portrait": false,
  "reference": "https://storage.googleapis.com/…?X-Goog-Signature=…",
  "reference_expires": 3600,
  "created_at": "2026-09-21T22:00:02Z"
}`}</Code>
        <p className="mt-3 text-muted">
          Listing returns that same shape for every asset. <code className="text-gold-2">?type=</code> and{" "}
          <code className="text-gold-2">?portrait=true</code> narrow it.
        </p>
        <Code>{`curl -sS "${host}/v1/assets?portrait=true" \
  -H "Authorization: Bearer $FLUXION_API_KEY"

{ "assets": [ { "id": "0a7304de…", "name": "Ana", "type": "image", "portrait": true } ] }`}</Code>
        <p className="mt-3 text-muted">
          Deleting removes it from your library and, if it was a portrait, from the video provider —
          immediately, and that part cannot be undone. A file some generation was made from is refused with{" "}
          <code className="text-danger">409</code> until you add <code className="text-gold-2">?confirm=1</code>,
          because deleting it means that generation can never be re-run.
        </p>
      </div>

      <div>
        <h3
          id="portraits"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          Portraits
        </h3>
        <p className="mt-2 text-muted">
          A portrait is an image registered with the video provider so it can be reused as a character. It is
          not a different kind of asset — it is one of yours, with{" "}
          <code className="text-gold-2">portrait: true</code> on it.
        </p>
        <p className="mt-3 text-muted">
          What registering buys is not a new kind of input: the model takes the same image either way. The
          difference is that models generating people intercept reference material that looks like a deepfake
          or an infringement, and a registered image is let through where the same file sent as a plain link
          is stopped. It also keeps a character recognisably the same across clips.
        </p>
        <Code>{`curl -sS ${host}/v1/assets \
  -H "Authorization: Bearer $FLUXION_API_KEY" \
  -F file=@ana.jpg -F name="Ana" -F portrait=person`}</Code>
        <Fields
          rows={[
            ["portrait=virtual", "enum", "A character you invented."],
            ["portrait=person", "enum", "A real human being. You are asserting they agreed to this, and we keep a record of it."],
          ]}
        />
        <p className="mt-4 text-muted">
          Registering is asynchronous and not instant. The asset exists straight away and works as an ordinary
          file; <code className="text-gold-2">portrait</code> turns <code className="text-gold-2">true</code>{" "}
          when the provider accepts it, usually within a few minutes. Until then{" "}
          <code className="text-gold-2">portrait_status</code> says where it has got to —{" "}
          <code className="text-gold-2">pending</code>, <code className="text-gold-2">processing</code>, or{" "}
          <code className="text-gold-2">failed</code> with their own reason in{" "}
          <code className="text-gold-2">portrait_error</code>, most often their content review. Poll{" "}
          <code className="text-gold-2">GET /v1/assets?portrait=true</code> until it appears.
        </p>
        <p className="mt-3 text-muted">
          Two things worth knowing before registering in bulk. Each portrait takes a slot in a quota we buy
          from the provider, so register the characters you will reuse rather than everything you upload. And
          deleting one reaches the provider immediately and cannot be undone — uploading the same face
          again is one call, but it has to be prepared from scratch.
        </p>
      </div>

      <div>
        <h3
          id="references"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          Using an asset in a generation
        </h3>
        <p className="mt-2 text-muted">
          A generation takes the asset&apos;s <code className="text-gold-2">reference</code>, not its id. Every
          response above carries one, ready to paste in.
        </p>
        <Code>{`# 1. what do I have?
curl -sS ${host}/v1/assets -H "Authorization: Bearer $FLUXION_API_KEY"

# 2. generate, passing the reference through
curl -sS ${host}/v1/videos \
  -H "Authorization: Bearer $FLUXION_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "model": "Seedance-2.5",
    "prompt": "The woman in Image 1 walks through the market in Image 2, smiling.",
    "seconds": 10,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "metadata": {
      "reference_image": [
        "asset://asset-20260922060506-lkqdg",
        "https://storage.googleapis.com/…?X-Goog-Signature=…"
      ]
    }
  }'`}</Code>
        <p className="mt-4 text-muted">
          <strong className="text-fg">The two kinds of reference behave differently, and it matters.</strong>{" "}
          A portrait&apos;s is an <code className="text-gold-2">asset://</code> value that never expires —
          cache it and reuse it for ever. Any other file&apos;s is a signed link that lasts{" "}
          <code className="text-gold-2">reference_expires</code> seconds, so fetch it when you are about to
          generate rather than storing it.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-fg">The prompt names them by position.</strong>{" "}
          <code className="text-gold-2">Image 1</code>, <code className="text-gold-2">Image 2</code>,{" "}
          <code className="text-gold-2">Video 1</code>, <code className="text-gold-2">Audio 1</code> —
          counting within each type, in the order you put them in the list. Never put an id in the prompt: it
          is not recognised, and the model reads it as words.
        </p>
        <p className="mt-3 text-muted">
          The same values go in <code className="text-gold-2">metadata.reference_video</code>,{" "}
          <code className="text-gold-2">metadata.reference_audio</code> and{" "}
          <code className="text-gold-2">metadata.first_frame_image</code>. You can also pass any public{" "}
          <code className="text-gold-2">https</code> URL of your own and skip assets entirely — they exist
          so you do not have to host anything, and so a face is one id away next time.
        </p>
      </div>
    </div>
  );
}
