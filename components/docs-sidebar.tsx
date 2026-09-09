"use client";

import { useState } from "react";

type Nav = { group: string; items: { id: string; label: string }[] }[];

export function DocsSidebar({ nav }: { nav: Nav }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = nav
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !query || it.label.toLowerCase().includes(query) || g.group.toLowerCase().includes(query)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside className="hidden w-1/4 shrink-0 border-r border-line bg-surface/60 lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto px-6 py-8">
        <div className="relative">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search docs"
            className="w-full rounded-none border border-line-strong bg-raised py-2 pl-8 pr-2 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
          />
        </div>

        <nav className="mt-6 space-y-6">
          {groups.length === 0 ? (
            <p className="text-sm text-dim">No results for &ldquo;{q}&rdquo;.</p>
          ) : (
            groups.map((g) => (
              <div key={g.group}>
                <p className="font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.1em] text-dim">{g.group}</p>
                <ul className="mt-2 space-y-1">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <a href={`#${it.id}`} className="block py-1 text-sm text-muted transition-colors hover:text-gold-soft">
                        {it.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>
      </div>
    </aside>
  );
}
