"use client";

// Renders one of the legal documents the backend publishes (Terms, Privacy,
// Refunds). The text is markdown held in the hub, so an operator edits it in
// one place; this component fetches it and renders the small subset of markdown
// the documents use. No HTML from the document is ever inserted as markup.

import { useEffect, useState } from "react";
import Link from "next/link";
import { BACKEND_ENABLED, getLegalDocument, type LegalDocument } from "@/lib/hub";

function inline(text: string, keyPrefix: string) {
  // **bold**, `code` and [label](href), in one pass.
  const parts: React.ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${index++}`;
    if (match[1]) parts.push(<strong key={key} className="text-fg">{match[1]}</strong>);
    else if (match[2]) parts.push(<code key={key} className="text-gold-2">{match[2]}</code>);
    else if (match[3] && match[4]) {
      const href = match[4];
      parts.push(
        href.startsWith("/") ? (
          <Link key={key} href={href} className="text-blue hover:text-gold-soft">{match[3]}</Link>
        ) : (
          <a key={key} href={href} className="text-blue hover:text-gold-soft">{match[3]}</a>
        ),
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function Markdown({ source }: { source: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = source.split("\n");
  let bullets: string[] = [];
  let paragraph: string[] = [];

  function flushBullets() {
    if (!bullets.length) return;
    const items = [...bullets];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-5 list-disc space-y-1.5 text-muted">
        {items.map((item, i) => <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>)}
      </ul>,
    );
    bullets = [];
  }
  function flushParagraph() {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p-${blocks.length}`} className="text-muted">{inline(text, `p-${blocks.length}`)}</p>);
    paragraph = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushBullets();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushBullets();
      const level = heading[1].length;
      const text = heading[2];
      blocks.push(
        level === 1 ? (
          <h1 key={`h-${blocks.length}`} className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em] text-fg">{text}</h1>
        ) : level === 2 ? (
          <h2 key={`h-${blocks.length}`} className="mt-8 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-soft">{text}</h2>
        ) : (
          <h3 key={`h-${blocks.length}`} className="mt-4 text-sm font-medium text-fg">{text}</h3>
        ),
      );
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
      continue;
    }
    const italic = /^_(.+)_$/.exec(line.trim());
    if (italic) {
      flushParagraph();
      flushBullets();
      blocks.push(<p key={`i-${blocks.length}`} className="text-xs uppercase tracking-[0.06em] text-dim">{italic[1]}</p>);
      continue;
    }
    flushBullets();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushBullets();
  return <div className="space-y-4 text-sm leading-relaxed">{blocks}</div>;
}

export function LegalDocument({ slug, title }: { slug: "terms" | "privacy" | "refunds"; title: string }) {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!BACKEND_ENABLED) return;
    getLegalDocument(slug)
      .then(setDoc)
      .catch(() => setFailed(true));
  }, [slug]);

  return (
    <div className="max-w-3xl">
      {doc?.published ? (
        <Markdown source={doc.markdown} />
      ) : (
        <>
          <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">{title}</h1>
          <p className="mt-4 text-sm text-muted">
            {failed || !BACKEND_ENABLED
              ? "This document is published on the live site."
              : "Loading…"}
          </p>
        </>
      )}
    </div>
  );
}
