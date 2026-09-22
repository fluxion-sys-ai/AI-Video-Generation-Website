"use client";

import { modelTint, modelFeatured } from "@/lib/model-tint";
import { matchesAllTags, modelSearchText, modelTags } from "@/lib/model-facets";
import { unitRate, unitRateLabel } from "@/lib/rate-card";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ModelCard } from "@/components/models/model-card";
import { PreviewBadge } from "@/components/models/preview-badge";
import { ModelPoster } from "@/components/models/model-poster";
import { getModels, refreshCatalog, type Model } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { isFavorite, toggleFavorite } from "@/lib/prefs";
import { useSkin } from "@/lib/use-skin";
import type { Kind } from "@/components/ui/kind-switch";

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

/**
 * The chips that narrow one section's list.
 *
 * One of these per kind, above that kind's own models, because a video's tags
 * and a picture's have almost nothing in common - a single row of both came to
 * 39 chips, most of them narrowing a list the reader was not looking at. Each
 * row is only ever about the models directly beneath it, and a selection in
 * one does not touch the other.
 */
function TagChips({ allTags, tags, toggleTag, clear }: {
  allTags: string[];
  tags: Set<string>;
  toggleTag: (t: string) => void;
  clear: () => void;
}) {
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

/**
 * "Video models" / "Image models", above a section.
 *
 * Only rendered when the account has both kinds. With one kind the page is the
 * single list it has always been, and a heading saying so would be noise.
 */
function KindHeading({ kind, count }: { kind: Kind; count: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.12em] text-gold">
        {kind === "image" ? "Image models" : "Video models"}
      </h2>
      <span className="text-xs text-dim">{count}</span>
      <span className="h-px flex-1 bg-hairline" />
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

export function ModelCatalog({ models: initial }: { models: Model[] }) {
  const skin = useSkin();
  // In backend mode the catalog comes from the database, so prefer the live list
  // over the one this page was exported with.
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const all = BACKEND_ENABLED ? getModels() : initial;
  const [q, setQ] = useState("");
  // One selection per section, because there is one chip row per section: a
  // tag chosen among the video models must not filter the image models by
  // something their own row does not even offer.
  const [tags, setTags] = useState<Record<Kind, Set<string>>>({ video: new Set(), image: new Set() });
  const [sort, setSort] = useState<Sort>("popular");
  const query = q.trim().toLowerCase();

  function toggleTag(kind: Kind, tag: string) {
    setTags((prev) => {
      const next = new Set(prev[kind]);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return { ...prev, [kind]: next };
    });
  }
  const clearTags = (kind: Kind) => setTags((prev) => ({ ...prev, [kind]: new Set() }));

  /**
   * One section per kind: its heading, its own chips, its own models.
   *
   * Both are on the page at once rather than behind a switch - browsing is not
   * a mode, and someone on this page is comparing what is available rather
   * than having already decided which sort of thing they want. Search and sort
   * stay shared at the top, because those are the same question for both.
   */
  const sections = (["video", "image"] as const)
    .map((kind) => {
      const models = all.filter((m) => (m.modality === "image") === (kind === "image"));
      // Each chip narrows this section's list (see lib/model-facets.ts): a
      // model has to satisfy every selected tag, and a tag is anything true
      // about it - a capability it lists or a resolution it sells - not only a
      // label it happens to carry.
      let list = models.filter(
        (m) => (!query || modelSearchText(m).includes(query)) && matchesAllTags(m, tags[kind]),
      );
      // By the model's own unit: an image model has no per-second rate, and
      // sorting on the zero it would report put all of them at the cheap end.
      if (sort === "price-asc") list = [...list].sort((a, b) => unitRate(a).usd - unitRate(b).usd);
      else if (sort === "price-desc") list = [...list].sort((a, b) => unitRate(b).usd - unitRate(a).usd);
      else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      return { kind, models, list, allTags: modelTags(models) };
    })
    // A kind the account has none of is not an empty section; it is not a
    // section. Image models are invitation-based, so for most accounts this
    // page is the single list it has always been.
    .filter((section) => section.models.length > 0);

  // With one kind, no headings: they would be labelling the only thing there.
  const titled = sections.length > 1;

  /**
   * The chrome around one section's list, so each skin only has to say how it
   * draws the models themselves.
   */
  const Section = ({
    section, children, gap = "mt-8", style,
  }: {
    section: (typeof sections)[number];
    children: (list: Model[]) => React.ReactNode;
    gap?: string;
    style?: React.CSSProperties;
  }) => (
    // Space after the search row for the first section, and a clear gap
    // between sections after that. Not `first:` - in most skins this is not the
    // first child of its parent, so the selector would never match.
    <section key={section.kind} className={sections.indexOf(section) === 0 ? "mt-4" : "mt-12"}>
      {titled && <div className="mb-4"><KindHeading kind={section.kind} count={section.models.length} /></div>}
      <TagChips
        allTags={section.allTags}
        tags={tags[section.kind]}
        toggleTag={(t) => toggleTag(section.kind, t)}
        clear={() => clearTags(section.kind)}
      />
      {section.list.length === 0 ? (
        <p className="mt-8 text-sm text-dim">
          No {section.kind === "image" ? "image" : "video"} models match your filters.
        </p>
      ) : (
        <div className={gap} style={style}>{children(section.list)}</div>
      )}
    </section>
  );

  // ===== EDITORIAL, no big title; search up top; Instagram-style feed. =====
  if (skin === "editorial") {
    return (
      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <SearchBox q={q} setQ={setQ} className="flex-1" placeholder="Search the feed" />
          <SortSelect sort={sort} setSort={setSort} />
        </div>
        {sections.map((section) => (
          <Section key={section.kind} section={section} gap="mt-8 grid gap-6 sm:grid-cols-2">
            {(list) => list.map((m) => (
              <article key={m.slug} className="overflow-hidden rounded-[18px] bg-surface shadow-lg">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-ink" style={{ background: "linear-gradient(135deg, var(--c-accent-ink), var(--c-gold))" }}>{m.name[0]}</span>
                  <Link href={`/generate?model=${m.slug}`} className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-fg-strong hover:underline">{m.name.toLowerCase()}</span>
                      {m.preview && <PreviewBadge />}
                    </span>
                    <span className="block truncate text-xs text-muted">{m.tagline}</span>
                  </Link>
                </div>
                <Link href={`/generate?model=${m.slug}`} className="block">
                  <ModelPoster slug={m.slug} name={m.name} src={m.poster} className="relative aspect-square" />
                </Link>
                <div className="flex items-center gap-4 px-4 py-3 text-fg-strong">
                  <FavHeart slug={m.slug} />
                  <span className="text-sm text-muted">{m.description}</span>
                </div>
              </article>
            ))}
          </Section>
        ))}
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
        <div className="mt-5 flex justify-end"><SortSelect sort={sort} setSort={setSort} /></div>
        {sections.map((section) => (
          <Section key={section.kind} section={section} gap="mt-8">
            {(list) => list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} className="group flex items-center gap-6 border-t border-line py-6 last:border-b hover:bg-hover">
                <b className="min-w-[52px] font-[family-name:var(--font-playfair)] text-3xl text-accent-ink">{String(i + 1).padStart(2, "0")}</b>
                <ModelPoster slug={m.slug} name={m.name} src={m.poster} className="relative hidden h-16 w-28 shrink-0 rounded-[8px] sm:block" />
                <div className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-playfair)] text-xl text-fg-strong">{m.name}</span>
                    {m.preview && <PreviewBadge />}
                  </span>
                  <span className="text-sm text-muted">{m.tagline} · up to {m.resolutions[m.resolutions.length - 1]}</span>
                </div>
                <span className="hidden font-[family-name:var(--font-jetbrains)] text-sm text-gold sm:block">{unitRateLabel(m)}</span>
                <FavHeart slug={m.slug} />
                <span className="text-accent-ink transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </Section>
        ))}
      </div>
    );
  }

  // ===== PLAYFUL, chunky title, big centered pill search, pastel bento. =====
  if (skin === "playful") {
    return (
      <div className="relative mx-auto max-w-6xl text-center">
        <h1 className="text-[clamp(34px,5vw,60px)] font-extrabold text-fg-strong">Browse the models</h1>
        <div className="mx-auto mt-6 max-w-xl">
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" /><path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a vibe…" className="w-full rounded-full border-2 border-accent-border bg-surface py-3.5 pl-11 pr-4 text-center text-sm text-fg outline-none placeholder:text-dim" style={{ boxShadow: "5px 5px 0 rgba(26,20,64,0.12)" }} />
          </div>
        </div>
        {sections.map((section) => (
          <Section key={section.kind} section={section} gap="mt-8 grid auto-rows-[220px] grid-cols-2 gap-6 text-left lg:grid-cols-4">
            {(list) => list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} className={`group relative overflow-hidden rounded-[24px] p-5 transition-transform hover:-translate-y-1 ${modelFeatured(m.sortOrder ?? i) ? "col-span-2 row-span-2" : ""}`} style={{ background: modelTint(m.slug), color: "#1a1440", boxShadow: "6px 6px 0 rgba(26,20,64,0.16)" }}>
                <ModelPoster
                  slug={m.slug}
                  name={m.name}
                  src={m.poster}
                  className="absolute inset-0"
                  imageClassName="h-full w-full object-cover opacity-90 mix-blend-luminosity transition-opacity group-hover:opacity-100"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${modelTint(m.slug)}dd)` }} />
                <div className="absolute right-4 top-4"><FavHeart slug={m.slug} light /></div>
                {m.preview && <div className="absolute left-4 top-4"><PreviewBadge tone="light" /></div>}
                <div className="relative flex h-full flex-col justify-end">
                  <h3 className="text-2xl font-extrabold">{m.name}</h3>
                  <p className="text-sm" style={{ color: "#4a4570" }}>{m.tagline}</p>
                </div>
              </Link>
            ))}
          </Section>
        ))}
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
        {sections.map((section) => (
          <Section
            key={section.kind}
            section={section}
            gap="mt-6 grid auto-cols-[300px] grid-flow-col grid-rows-2 gap-5 overflow-x-auto pb-4"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {(list) => list.map((m, i) => (
              <Link key={m.slug} href={`/generate?model=${m.slug}`} style={{ scrollSnapAlign: "start" }} className="group overflow-hidden rounded-[12px] border border-hairline bg-surface transition-transform hover:-translate-y-1">
                <div className="relative aspect-video overflow-hidden">
                  <ModelPoster
                    slug={m.slug}
                    name={m.name}
                    src={m.poster}
                    className="absolute inset-0"
                    imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2.5 py-1 font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.06em] text-white backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
                  <div className="absolute right-2.5 top-2.5"><FavHeart slug={m.slug} light /></div>
                </div>
                <div className="p-4">
                  <span className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-space)] text-lg font-semibold text-fg-strong">{m.name}</h3>
                    {m.preview && <PreviewBadge />}
                  </span>
                  <p className="mt-1 text-sm text-muted">{m.tagline}</p>
                  <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-accent-ink">{unitRateLabel(m)} · {m.resolutions[m.resolutions.length - 1]} →</p>
                </div>
              </Link>
            ))}
          </Section>
        ))}
      </div>
    );
  }

  // ===== OG, the original catalog. =====
  return (
    <div className="relative">
      <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">Models</span>
      <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">Model catalog</h1>
      <span className="mt-3 block h-px w-10 bg-gold" />
      <p className="mt-4 max-w-xl text-muted">
        Compare models by capability, duration, and resolution. Hover a card to preview.
        {sections.length > 1 && " Image models are listed separately below: they are priced per picture, and sized rather than timed."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox q={q} setQ={setQ} className="w-full max-w-md" placeholder="Search models by name or capability" />
        <SortSelect sort={sort} setSort={setSort} />
      </div>
      {sections.map((section) => (
        <Section key={section.kind} section={section} gap="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {(list) => list.map((m) => <ModelCard key={m.slug} model={m} highlight={tags[section.kind]} />)}
        </Section>
      ))}
    </div>
  );
}
