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

type Lang = "curl" | "js" | "python";
const LANGS: { id: Lang; label: string }[] = [
  { id: "curl", label: "cURL" },
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
];

/**
 * One example in three languages.
 *
 * Uploading a local file is the thing people get stuck on, and cURL is the one
 * place it looks easy: `-F file=@photo.jpg` hides everything. The JavaScript
 * and Python versions exist because that is where the multipart body actually
 * has to be assembled, and "post multipart/form-data" is not an instruction
 * anybody can act on without seeing it done once.
 */
function Snippets({ by }: { by: Record<Lang, string> }) {
  const [lang, setLang] = useState<Lang>("curl");
  return (
    <div className="mt-3">
      <div className="flex gap-4 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em]">
        {LANGS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setLang(id)}
            className={`pb-1 transition-colors ${
              lang === id ? "border-b border-accent text-accent-ink" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <Code>{by[lang]}</Code>
    </div>
  );
}

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
            ["portrait", "boolean", "Register this image as a reusable character. Images only."],
          ]}
        />
        <Snippets
          by={{
            curl: `curl -sS ${host}/v1/assets \
  -H "Authorization: Bearer $FLUXION_API_KEY" \
  -F file=@lead-singer.jpg -F name="Ana"

{
  "id": "0a7304deacbf42e6bc8d908d6c67ba8d",
  "name": "Ana",
  "type": "image",
  "bytes": 184213,
  "portrait": false,
  "portrait_status": null,
  "portrait_error": null,
  "created_at": "2026-09-21T22:00:02Z",
  "reference": "$REFERENCE_0A7304DE"
}`,
            js: `import { readFile } from "node:fs/promises";

const form = new FormData();
// A File keeps the name and type; a bare Blob arrives called "upload".
form.append("file", new File([await readFile("lead-singer.jpg")], "lead-singer.jpg", {
  type: "image/jpeg",
}));
form.append("name", "Ana");
// form.append("portrait", "true");     // also register it as a character

const res = await fetch("${host}/v1/assets", {
  method: "POST",
  // No Content-Type here: fetch sets it, with the multipart boundary.
  headers: { Authorization: "Bearer " + process.env.FLUXION_API_KEY },
  body: form,
});
const asset = await res.json();
console.log(asset.id, asset.reference);

// In a browser it is the same call with the file straight from an input:
//   form.append("file", input.files[0]);`,
            python: `import os, requests

with open("lead-singer.jpg", "rb") as fh:
    asset = requests.post(
        "${host}/v1/assets",
        headers={"Authorization": "Bearer " + os.environ["FLUXION_API_KEY"]},
        # requests builds the multipart body and sets the boundary itself.
        files={"file": ("lead-singer.jpg", fh, "image/jpeg")},
        data={"name": "Ana"},          # "portrait": "true" to register it
    ).json()

print(asset["id"], asset["reference"])`,
          }}
        />
        <p className="mt-3 text-muted">
          Listing returns exactly the same object for every asset — nothing is trimmed, so whatever you can
          read after creating one you can read again here. <code className="text-gold-2">?type=</code> and{" "}
          <code className="text-gold-2">?portrait=true</code> narrow it.
        </p>
        <Code>{`curl -sS "${host}/v1/assets?portrait=true" \
  -H "Authorization: Bearer $FLUXION_API_KEY"

{
  "assets": [
    {
      "id": "0a7304deacbf42e6bc8d908d6c67ba8d",
      "name": "Ana",
      "type": "image",
      "bytes": 184213,
      "portrait": true,
      "portrait_status": null,
      "portrait_error": null,
      "created_at": "2026-09-21T22:00:02Z",
      "reference": "$REFERENCE_0A7304DE"
    }
  ]
}`}</Code>
        <Fields
          rows={[
            ["id", "string", "The asset. Use it to delete one."],
            ["name", "string", "What you called it, or the filename."],
            ["type", "enum", "image, video or audio."],
            ["bytes", "integer", "Size on disk. Storage is charged by the gigabyte-month."],
            ["portrait", "boolean", "Whether the video provider has accepted it as a reusable character."],
            ["portrait_status", "enum", "pending, processing or failed while it is being registered; null once portrait is true, and null if it never was one."],
            ["portrait_error", "string", "The provider's reason, when registering failed."],
            ["created_at", "string", "RFC 3339, when it was stored."],
            ["reference", "string", "What to write in a generation request. Does not expire."],
          ]}
        />
        <p className="mt-5 text-muted">
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
  -F file=@ana.jpg -F name="Ana" -F portrait=true`}</Code>
        <p className="mt-3 text-muted">
          It is a yes or no. There is no kind to choose: the provider has two libraries and only one of them
          can be reached at all, so an invented character and a real person go to the same place. By
          registering one you are asserting you have the right to use the likeness, and we keep a record of
          that with the file.
        </p>
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

# 2. generate, writing those references straight into the request
curl -sS ${host}/v1/videos \
  -H "Authorization: Bearer $FLUXION_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "model": "Seedance-2.5",
    "prompt": "The woman in Image 1 walks through the market in Image 2, smiling.",
    "seconds": 10,
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "metadata": {
      "reference_image": ["$REFERENCE_0A7304DE", "$REFERENCE_31CA18C7"]
    }
  }'`}</Code>
        <p className="mt-4 text-muted">
          <strong className="text-fg">A reference does not expire.</strong> It names one of your assets, and
          what it stands for — a registered portrait, or a fresh link to your file — is worked out when the
          request is submitted. Store it in your own config if you like; it keeps working.
        </p>
        <p className="mt-3 text-muted">
          <strong className="text-fg">The prompt names them by position.</strong>{" "}
          <code className="text-gold-2">Image 1</code>, <code className="text-gold-2">Image 2</code>,{" "}
          <code className="text-gold-2">Video 1</code>, <code className="text-gold-2">Audio 1</code> —
          counting within each type, in the order you put them in the list. Never put a reference or an id in
          the prompt itself: it is not recognised, and the model reads it as words.
        </p>
        <p className="mt-3 text-muted">
          A reference that names nothing is refused with <code className="text-danger">404</code> before the
          job is submitted, so a typo costs you a message rather than a generation.
        </p>
        <p className="mt-3 text-muted">
          The same values go in <code className="text-gold-2">metadata.reference_video</code>,{" "}
          <code className="text-gold-2">metadata.reference_audio</code> and{" "}
          <code className="text-gold-2">metadata.first_frame_image</code>. You can still pass any public{" "}
          <code className="text-gold-2">https</code> URL of your own instead — assets exist so you do not have
          to host anything, not because the API insists on them.
        </p>
      </div>
    </div>
  );
}
