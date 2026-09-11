"use client";

import { useEffect, useState } from "react";

// Bottom-right toast stack. Mounted once in the root layout; shows any message
// dispatched via lib/toast's `toast()`.
type Item = { id: number; msg: string };

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const msg = String((e as CustomEvent).detail ?? "");
      if (!msg) return;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, msg }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2200);
    }
    window.addEventListener("fluxion-toast", onToast);
    return () => window.removeEventListener("fluxion-toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-slide-in flex items-center gap-2 rounded-[10px] border border-line bg-panel px-4 py-2.5 text-sm text-fg shadow-xl shadow-black/40"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--c-accent)" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 8.5 L6.5 12 L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
