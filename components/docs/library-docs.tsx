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
          How a file becomes an input
        </h3>
        <p className="mt-2 text-muted">
          Uploading and using are two steps, and the second one is easy to miss. A file you upload is kept
          indefinitely and costs storage; it is not attached to anything. When you generate, one call turns
          your stored files into the values <code className="text-gold-2">/v1/videos</code> accepts — checking
          them against that model&apos;s rules first, so a file it cannot use is refused with a reason rather
          than by the provider several seconds later.
        </p>
        <Code>{`1.  POST /media/library/media          store a file, once
2.  POST /media/library/references     check it against a model, get usable values
3.  POST /v1/videos                    generate, passing those values through`}</Code>
        <p className="mt-3 text-muted">
          You can skip the library entirely and pass public <code className="text-gold-2">https</code> URLs of
          your own straight to <code className="text-gold-2">/v1/videos</code>. The library exists so you do
          not have to host anything, and so the same face or clip is one id away next time.
        </p>
      </div>

      <div>
        <h3
          id="library-endpoints"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          What you have
        </h3>
        <Endpoints
          rows={[
            ["GET /media/library/assets", "Everything: files you uploaded and videos we generated, in one list."],
            ["GET /media/library/media", "Uploads only, with folders and the limits that apply."],
            ["POST /media/library/media", "Store a file. multipart/form-data."],
            ["PATCH /media/library/media/{id}", "Rename, favourite, or move to a folder."],
            ["DELETE /media/library/media/{id}", "Remove an upload from your library."],
            ["GET /media/library/media/{id}/link", "A short-lived URL for one file."],
            ["DELETE /media/videos/{task_id}", "Remove a generated video."],
          ]}
        />

        <p className="mt-5 text-muted">
          <code className="text-gold-2">GET /media/library/assets</code> takes four optional query
          parameters. They narrow the list; nothing is required.
        </p>
        <Fields
          rows={[
            ["source", "enum", "uploaded, generated, or all. Defaults to all."],
            ["kind", "enum", "image, video or audio. A generated clip is always a video, so asking for images excludes them."],
            ["character", "boolean", "true for images registered as portraits, false for the rest."],
            ["limit", "integer", "1–500. Defaults to 200."],
          ]}
        />
        <Code>{`curl -sS "${host}/media/library/assets?source=uploaded&kind=image&character=true" \\
  -H "Authorization: Bearer $FLUXION_API_KEY"

{
  "items": [
    {
      "id": "0a7304deacbf42e6bc8d908d6c67ba8d",
      "source": "uploaded",
      "kind": "image",
      "name": "lead-singer.jpg",
      "content_type": "image/jpeg",
      "bytes": 184213,
      "width": 1200, "height": 1600,
      "duration_seconds": null,
      "created_at": "2026-09-21T22:00:02Z",
      "url": "https://…",
      "character": { "id": "por_…", "status": "ready", "kind": "person", "error": null }
    }
  ],
  "counts": { "uploaded": 41, "generated": 12, "characters": 2 }
}`}</Code>
        <p className="mt-3 text-muted">
          Every row says what it is rather than leaving you to infer it: <code className="text-gold-2">source</code>{" "}
          and <code className="text-gold-2">kind</code> are always present, and{" "}
          <code className="text-gold-2">character</code> is either the registration or{" "}
          <code className="text-gold-2">null</code>. Deleting stays on each thing&apos;s own route, because
          removing an upload and removing a generated video are genuinely different operations.
        </p>

        <p className="mt-5 text-muted">Uploading is a multipart post. Only <code className="text-gold-2">file</code> is required.</p>
        <Fields
          rows={[
            ["file", "binary", "The image, video or audio file."],
            ["model", "string", "Which model you had in mind. Only used to group things in your library."],
            ["folder_id", "string", "A folder to file it under."],
            ["character", "enum", "virtual or person — also register this image as a portrait. Images only. See below."],
            ["consent", "json", "What you are asserting about the image, stored with it. Required with character=person."],
          ]}
        />
        <Code>{`curl -sS ${host}/media/library/media \\
  -H "Authorization: Bearer $FLUXION_API_KEY" \\
  -F file=@lead-singer.jpg`}</Code>
      </div>

      <div>
        <h3
          id="portraits"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          Portraits
        </h3>
        <p className="mt-2 text-muted">
          A portrait is an image you registered with the video provider so it can be reused as a character.
          It is not a different kind of file — it is one of your images, with a note on it.
        </p>
        <p className="mt-3 text-muted">
          What registering buys is not a new kind of input. Models that generate people intercept reference
          material that looks like a deepfake or an infringement; a registered image is let through where the
          same file sent as a plain link is stopped. It also keeps a character consistent across clips.
        </p>
        <Endpoints
          rows={[
            ["POST /media/library/media/{id}/character", "Register an image. Body: { kind, consent }."],
            ["DELETE /media/library/media/{id}/character", "Stop it being a portrait. The image itself stays."],
          ]}
        />
        <Fields
          rows={[
            ["kind", "enum", "virtual for a character you invented, person for a real human being."],
            ["consent.has_permission", "boolean", "Required for person: you have their agreement and can show it."],
          ]}
        />
        <Code>{`curl -sS ${host}/media/library/media/0a7304de…/character \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H 'Content-Type: application/json' \\
  -d '{"kind": "person", "consent": {"has_permission": true}}'

{ "id": "por_…", "status": "pending", "kind": "person", "error": null }`}</Code>
        <p className="mt-3 text-muted">
          Registering is asynchronous and not instant. Status goes{" "}
          <code className="text-gold-2">pending</code> → <code className="text-gold-2">processing</code> →{" "}
          <code className="text-gold-2">ready</code>, usually in a few minutes, and there is no promised
          turnaround. It can also end at <code className="text-gold-2">failed</code>, with the provider&apos;s
          own reason in <code className="text-gold-2">error.message</code> — most often their content review.
          Poll <code className="text-gold-2">GET /media/library/assets?character=true</code> until it settles.
          Only a <code className="text-gold-2">ready</code> portrait is used; one still preparing travels as an
          ordinary file.
        </p>
        <p className="mt-3 text-muted">
          Two things worth knowing before you register in bulk. Each portrait takes a slot in a quota we buy
          from the provider, so register the characters you will reuse rather than everything. And removing
          one reaches the provider immediately and cannot be undone — your file is untouched, so registering
          again is one call, but it has to be prepared from scratch.
        </p>
      </div>

      <div>
        <h3
          id="references"
          className="scroll-mt-28 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.06em] text-fg-soft"
        >
          Using files in a generation
        </h3>
        <p className="mt-2 text-muted">
          <code className="text-gold-2">POST /media/library/references</code> takes library ids and returns
          the values to pass to <code className="text-gold-2">/v1/videos</code>. It checks each file against
          the model you name — format, codec, duration, dimensions, how many that model accepts — and refuses
          with <code className="text-danger">422</code> and a list of problems rather than letting the provider
          reject it later. Add <code className="text-gold-2">?dry_run=1</code> while a customer is still
          choosing: it checks and counts without minting anything.
        </p>
        <Code>{`curl -sS ${host}/media/library/references \\
  -H "Authorization: Bearer $FLUXION_API_KEY" -H 'Content-Type: application/json' \\
  -d '{
    "model": "Seedance-2.5",
    "reference_image": ["0a7304de…", "31ca18c7…"]
  }'

{
  "ok": true,
  "facts": { "input_video_seconds": 0, "input_images": 2, "input_audios": 0 },
  "registered": ["0a7304de…"],
  "urls": {
    "reference_image": [
      "asset://asset-20260922060506-lkqdg",     // a registered portrait
      "https://storage.googleapis.com/…?X-Goog-Signature=…"
    ]
  },
  "expires_at": 1790025750
}`}</Code>
        <p className="mt-3 text-muted">
          Pass <code className="text-gold-2">urls.reference_image</code> through unchanged as{" "}
          <code className="text-gold-2">metadata.reference_image</code>. A registered portrait comes back as
          an <code className="text-gold-2">asset://</code> reference and an ordinary file as a signed link;
          both go in the same list and you do not need to tell them apart.{" "}
          <code className="text-gold-2">registered</code> says which were which, if you want to show it.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-fg">Order matters, and it is the order you sent.</strong> The prompt refers
          to attachments by type and position — <code className="text-gold-2">Image 1</code>,{" "}
          <code className="text-gold-2">Video 1</code>, <code className="text-gold-2">Audio 1</code>, counting
          within each type. Never put an id in the prompt; it is not recognised, and the model will read it as
          words.
        </p>
        <Code>{`{
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
}`}</Code>
        <p className="mt-3 text-muted">
          Signed links expire — an hour by default, up to a day with{" "}
          <code className="text-gold-2">?ttl=</code> — so mint them just before you generate rather than
          storing them. An <code className="text-gold-2">asset://</code> reference does not expire; it names
          something the provider already holds.
        </p>
        <p className="mt-3 text-muted">
          When you read a past generation back from{" "}
          <code className="text-gold-2">GET /media/generations/&#123;id&#125;</code>, both forms are shown as{" "}
          <code className="text-gold-2">$REFERENCE_&lt;file&gt;</code>. One file reads the same way whether it
          travelled as a link or as a portrait, so the recorded request stays legible and you can re-run it by
          minting fresh values for the same ids.
        </p>
      </div>
    </div>
  );
}
