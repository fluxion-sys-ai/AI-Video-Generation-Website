"use client";

import { useState } from "react";
import { ModelCard } from "@/components/model-card";
import type { Model } from "@/lib/models";

export function ModelCatalog({ models }: { models: Model[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? models.filter((m) =>
        [m.name, m.tagline, m.description, ...m.capabilities].join(" ").toLowerCase().includes(query),
      )
    : models;

  return (
    <div className="relative mt-8">
      {/* search bar */}
      <div className="relative max-w-md">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim"
        >
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

      <div className="relative mt-8 py-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-dim">No models match &ldquo;{q}&rdquo;.</p>
        ) : (
          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {filtered.map((m) => (
              <ModelCard key={m.slug} model={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
