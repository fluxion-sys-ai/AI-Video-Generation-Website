"use client";

import { useEffect, useState } from "react";
import type { ToastKind } from "@/lib/toast";

// Bottom-right toast stack. Mounted once in the root layout; shows any message
// dispatched via lib/toast's `toast()`.
//
// An error does not time out. The messages that matter most here come from a
// provider - "the input image may contain real person. Request id: 0217…" - and
// a message like that disappearing after two seconds is the difference between
// a bug you can report and one you can only describe. So errors stay, are
// selectable, and carry a Copy button; acknowledgements behave as before.

type Item = { id: number; msg: string; kind: ToastKind };

const DISMISS_MS = 2200;

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail;
      // Older callers dispatch a bare string; both shapes are accepted so a
      // stale bundle in someone's tab cannot render an empty toast.
      const msg = String((typeof detail === "string" ? detail : detail?.message) ?? "");
      const kind: ToastKind = (typeof detail === "object" && detail?.kind === "error") ? "error" : "info";
      if (!msg) return;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, msg, kind }]);
      if (kind === "info") {
        setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), DISMISS_MS);
      }
    }
    window.addEventListener("fluxion-toast", onToast);
    return () => window.removeEventListener("fluxion-toast", onToast);
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  async function copy(item: Item) {
    try {
      await navigator.clipboard.writeText(item.msg);
      setCopied(item.id);
      setTimeout(() => setCopied((c) => (c === item.id ? null : c)), 1500);
    } catch {
      // A browser that refuses the clipboard still leaves the text selectable.
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex max-w-[min(30rem,calc(100vw-2.5rem))] flex-col items-end gap-2">
      {items.map((t) =>
        t.kind === "error" ? (
          <div
            key={t.id}
            role="alert"
            className="animate-slide-in pointer-events-auto w-full select-text rounded-[10px] border border-[var(--c-danger)] bg-panel p-3 text-sm text-fg shadow-xl shadow-black/40"
          >
            <div className="flex items-start gap-2">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--c-danger)" strokeWidth="1.8" aria-hidden="true" className="mt-0.5 shrink-0">
                <circle cx="8" cy="8" r="6.2" />
                <path d="M8 4.8 V8.6 M8 10.9 v0.5" strokeLinecap="round" />
              </svg>
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{t.msg}</p>
            </div>
            <div className="mt-2 flex justify-end gap-2 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em]">
              <button type="button" onClick={() => copy(t)} className="hit text-muted transition-colors hover:text-fg">
                {copied === t.id ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={() => dismiss(t.id)} className="hit text-muted transition-colors hover:text-fg">
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div
            key={t.id}
            className="animate-slide-in flex items-center gap-2 rounded-[10px] border border-line bg-panel px-4 py-2.5 text-sm text-fg shadow-xl shadow-black/40"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--c-accent)" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 8.5 L6.5 12 L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.msg}
          </div>
        ),
      )}
    </div>
  );
}
