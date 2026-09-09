"use client";

import { useState } from "react";

// Small copy-to-clipboard icon button, meant to sit in the top-right corner of a
// code block (parent should be `relative`). Flips to a check for ~1.4s on copy.
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      title={copied ? "Copied" : "Copy"}
      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-[7px] border border-hairline-strong bg-surface/85 text-muted backdrop-blur transition-colors hover:text-accent"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--c-accent)" strokeWidth="1.7" aria-hidden="true">
          <path d="M3 8.5 L6.5 12 L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 3.5H4.5A1 1 0 0 0 3.5 4.5V11" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
