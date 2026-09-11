"use client";

import { useState } from "react";
import { ModelCard } from "@/components/model-card";
import type { Model } from "@/lib/models";

type Sort = "popular" | "price-asc" | "price-desc" | "name";

const SORTS: { key: Sort; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A–Z" },
];

export function ModelCatalog({ models }: { models: Model[] }) {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("popular");
  const query = q.trim().toLowerCase();

  // Every capability/tag across the models (for the filter chips).
  const allTags = [...new Set(models.flatMap((m) => m.capabilities))];

  function toggleTag(t: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  // Filter by search + selected tags (a model matches if it has any selected tag).
  let list = models.filter((m) => {
    const matchesQuery = !query || [m.name, m.tagline, m.description, ...m.capabilities].join(" ").toLowerCase().includes(query);
    const matchesTags = tags.size === 0 || m.capabilities.some((c) => tags.has(c));
    return matchesQuery && matchesTags;
  });

  // Sort. "popular" keeps the curated source order.
  if (sort === "price-asc") list = [...list].sort((a, b) => a.creditsPerSecond - b.creditsPerSecond);
  else if (sort === "price-desc") list = [...list].sort((a, b) => b.creditsPerSecond - a.creditsPerSecond);
  else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="relative mt-8">
      {/* search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search models by name or capability"
            className="w-full rounded-none border border-line-strong bg-raised py-2.5 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-dim focus:border-blue"
          />
        </div>
        <label className="flex shrink-0 items-center gap-2">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="pg-select rounded-none border border-line-strong bg-raised px-3 py-2.5 text-sm text-fg outline-none focus:border-blue"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* tag filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-dim">Tags</span>
        {allTags.map((t) => {
          const on = tags.has(t);
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              className={`rounded-none border px-3 py-1.5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${
                on ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"
              }`}
            >
              {t}
            </button>
          );
        })}
        {tags.size > 0 && (
          <button onClick={() => setTags(new Set())} className="text-xs text-muted transition-colors hover:text-fg">
            Clear
          </button>
        )}
      </div>

      <div className="relative mt-8 py-4">
        {list.length === 0 ? (
          <p className="text-sm text-dim">No models match your filters.</p>
        ) : (
          <div className="mc-grid relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {list.map((m) => (
              <ModelCard key={m.slug} model={m} highlight={tags} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
