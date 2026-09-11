"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ModelCard } from "@/components/models/model-card";
import type { Model } from "@/lib/models";
import { isFavorite, toggleFavorite } from "@/lib/prefs";
import { useSkin } from "@/lib/use-skin";

type Sort = "popular" | "price-asc" | "price-desc" | "name";
const SORTS: { key: Sort; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A–Z" },
];

function FavHeart({ slug, light = false }: { slug: string; light?: boolean }) {
  const [fav, setFav] = useState(false);
  useEffect(() => setFav(isFavorite(slug)), [slug]);
  return (
    <button
      type="button"
      aria-label={fav ? "Unfavorite" : "Favorite"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFav(toggleFavorite(slug)); }}
      className="hit transition-transform active:scale-90"
    >
      <Heart size={18} strokeWidth={1.9} fill={fav ? "var(--c-heart)" : "none"} color={fav ? "var(--c-heart)" : light ? "#fff" : "currentColor"} />
    </button>
  );
}

function SortSelect({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  return (
    <label className="flex shrink-0 items-center gap-2">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">Sort</span>
      <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="pg-select rounded-none border border-line-strong bg-raised px-3 py-2.5 text-sm text-fg outline-none focus:border-blue">
        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </label>
  );
}

function TagChips({ allTags, tags, toggleTag, clear }: { allTags: string[]; tags: Set<string>; toggleTag: (t: string) => void; clear: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-dim">Tags</span>
      {allTags.map((t) => {
        const on = tags.has(t);
        return (
          <button key={t} onClick={() => toggleTag(t)} className={`rounded-none border px-3 py-1.5 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] transition-colors ${on ? "border-accent bg-accent-soft text-accent-ink" : "border-hairline-strong text-muted hover:bg-hover hover:text-fg"}`}>{t}</button>
        );
      })}
      {tags.size > 0 && <button onClick={clear} className="text-xs text-muted transition-colors hover:text-fg">Clear</button>}
    </div>
  );
}

function SearchBox({ q, setQ, className = "", placeholder = "Search models" }: { q: string; setQ: (s: string) => void; className?: string; placeholder?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full border border-line-strong bg-raised py-2.5 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-dim focus:border-blue" />
    </div>
  );
}

export function ModelCatalog({ models }: { models: Model[] }) {
  const skin = useSkin();
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("popular");
  const query = q.trim().toLowerCase();
  const allTags = [...new Set(models.flatMap((m) => m.capabilities))];

  function toggleTag(t: string) {
    setTags((prev) => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next; });
  }

  let list = models.filter((m) => {
    const matchesQuery = !query || [m.name, m.tagline, m.description, ...m.capabilities].join(" ").toLowerCase().includes(query);
    const matchesTags = tags.size === 0 || m.capabilities.some((c) => tags.has(c));
    return matchesQuery && matchesTags;
  });
  if (sort === "price-asc") list = [...list].sort((a, b) => a.creditsPerSecond - b.creditsPerSecond);
  else if (sort === "price-desc") list = [...list].sort((a, b) => b.creditsPerSecond - a.creditsPerSecond);
  else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  const empty = <p className="mt-8 text-sm text-dim">No models match your filters.</p>;

  // ===== EDITORIAL, no big title; search up top; Instagram-style feed. =====
  if (skin === "editorial") {
    return (
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <SearchBox q={q} setQ={setQ} className="flex-1" placeholder="Search the feed" />
          <SortSelect sort={sort} setSort={setSort} />
        </div>
        <div className="mt-4"><TagChips allTags={allTags} tags={tags} toggleTag={toggleTag} clear={() => setTags(new Set())} /></div>
        {list.length === 0 ? empty : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {list.map((m) => (
              <article key={m.slug} className="overflow-hidden rounded-[18px] bg-surface shadow-lg">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-ink" style={{ background: "linear-gradient(135deg, var(--c-accent-ink), var(--c-gold))" }}>{m.name[0]}</span>
                  <Link href={`/generate?model=${m.slug}`} className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold text-fg-strong hover:underline">{m.name.toLowerCase()}</span>
                    <span className="block truncate text-xs text-muted">{m.tagline}</span>
                  </Link>
                </div>
                <Link href={`/generate?model=${m.slug}`} className="block aspect-square bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.poster} alt={m.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex items-center gap-4 px-4 py-3 text-fg-strong">
                  <FavHeart slug={m.slug} />
                  <span className="text-sm text-muted">{m.description}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== LUXURY, serif title, minimal search, numbered index rows. =====
  if (skin === "luxury") {
    return (
      <div className="relative mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Fluxion</p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-[clamp(30px,4.5vw,52px)] text-fg-strong">The Collection</h1>
          </div>
          <SearchBox q={q} setQ={setQ} className="w-full max-w-xs" placeholder="Search the collection" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <TagChips allTags={allTags} tags={tags} toggleTag={toggleTag} clear={() => setTags(new Set())} />
          <SortSelect sort={sort} setSort={setSort} />
        </div>
        {list.length === 0 ? empty : (
          <div className="mt-8">
            {list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} className="group flex items-center gap-6 border-t border-line py-6 last:border-b hover:bg-hover">
                <b className="min-w-[52px] font-[family-name:var(--font-playfair)] text-3xl text-accent-ink">{String(i + 1).padStart(2, "0")}</b>
                <img src={m.poster} alt="" className="hidden h-16 w-28 shrink-0 rounded-[8px] bg-black object-cover sm:block" />
                <div className="min-w-0 flex-1">
                  <span className="block font-[family-name:var(--font-playfair)] text-xl text-fg-strong">{m.name}</span>
                  <span className="text-sm text-muted">{m.tagline} · up to {m.resolutions[m.resolutions.length - 1]}</span>
                </div>
                <span className="hidden font-[family-name:var(--font-jetbrains)] text-sm text-gold sm:block">{m.creditsPerSecond} cr/s</span>
                <FavHeart slug={m.slug} />
                <span className="text-accent-ink transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== PLAYFUL, chunky title, big centered pill search, pastel bento. =====
  if (skin === "playful") {
    const PASTELS = ["#fff2c2", "#d9ecff", "#ffd9ec", "#d9f5e6", "#e9ddff", "#ffe3d1"];
    return (
      <div className="relative mx-auto max-w-6xl text-center">
        <h1 className="text-[clamp(34px,5vw,60px)] font-extrabold text-fg-strong">Browse the models</h1>
        <div className="mx-auto mt-6 max-w-xl">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a vibe…" className="w-full rounded-full border-2 border-accent-border bg-surface py-3.5 pl-11 pr-4 text-center text-sm text-fg outline-none placeholder:text-dim" style={{ boxShadow: "5px 5px 0 rgba(26,20,64,0.12)" }} />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2"><TagChips allTags={allTags} tags={tags} toggleTag={toggleTag} clear={() => setTags(new Set())} /></div>
        {list.length === 0 ? empty : (
          <div className="mt-8 grid auto-rows-[220px] grid-cols-2 gap-6 text-left lg:grid-cols-4">
            {list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} className={`group relative overflow-hidden rounded-[24px] p-5 transition-transform hover:-translate-y-1 ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}`} style={{ background: PASTELS[i % PASTELS.length], color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" }}>
                <img src={m.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-luminosity transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${PASTELS[i % PASTELS.length]}dd)` }} />
                <div className="absolute right-4 top-4"><FavHeart slug={m.slug} light /></div>
                <div className="relative flex h-full flex-col justify-end">
                  <h3 className="text-2xl font-extrabold">{m.name}</h3>
                  <p className="text-sm" style={{ color: "#4a4570" }}>{m.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== SLIDESHOW, full-width banner slides you page through sideways. =====
  if (skin === "cosmos") {
    return (
      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.3em] text-accent-ink">Catalog</p>
            <h1 className="mt-1 font-[family-name:var(--font-space)] text-[clamp(28px,4vw,48px)] text-fg-strong">Swipe through the models</h1>
          </div>
          <div className="flex items-center gap-3"><SearchBox q={q} setQ={setQ} className="w-full max-w-xs" placeholder="Search" /><SortSelect sort={sort} setSort={setSort} /></div>
        </div>
        <div className="mt-4"><TagChips allTags={allTags} tags={tags} toggleTag={toggleTag} clear={() => setTags(new Set())} /></div>
        {list.length === 0 ? empty : (
          <div className="mt-6 grid auto-cols-[300px] grid-flow-col grid-rows-2 gap-5 overflow-x-auto pb-4" style={{ scrollSnapType: "x mandatory" }}>
            {list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} style={{ scrollSnapAlign: "start" }} className="group overflow-hidden rounded-[12px] border border-hairline bg-surface transition-transform hover:-translate-y-1">
                <div className="relative aspect-video overflow-hidden bg-black">
                  <img src={m.poster} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2.5 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-white backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
                  <div className="absolute right-2.5 top-2.5"><FavHeart slug={m.slug} light /></div>
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-space)] text-lg font-semibold text-fg-strong">{m.name}</h3>
                  <p className="mt-1 text-sm text-muted">{m.tagline}</p>
                  <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-accent-ink">{m.creditsPerSecond} cr/s · {m.resolutions[m.resolutions.length - 1]} →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== OG, the original catalog. =====
  return (
    <div className="relative">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Models</span>
      <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">Model catalog</h1>
      <span className="mt-3 block h-px w-10 bg-gold" />
      <p className="mt-4 max-w-xl text-muted">Compare models by capability, duration, and resolution. Hover a card to preview.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox q={q} setQ={setQ} className="w-full max-w-md" placeholder="Search models by name or capability" />
        <SortSelect sort={sort} setSort={setSort} />
      </div>
      <div className="mt-4"><TagChips allTags={allTags} tags={tags} toggleTag={toggleTag} clear={() => setTags(new Set())} /></div>
      {list.length === 0 ? empty : (
        <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {list.map((m) => <ModelCard key={m.slug} model={m} highlight={tags} />)}
        </div>
      )}
    </div>
  );
}
