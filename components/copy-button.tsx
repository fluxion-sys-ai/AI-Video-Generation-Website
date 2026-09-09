"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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
      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-[7px] text-muted transition-colors hover:text-accent"
    >
      {copied ? <Check size={15} strokeWidth={2} color="var(--c-accent)" /> : <Copy size={15} strokeWidth={1.8} />}
    </button>
  );
}
