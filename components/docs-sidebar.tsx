"use client";

import { useEffect, useState } from "react";

// Each nav item carries an optional `body` — a plain-text version of that
// section's content. Searching matches the label, its group, OR the body, so a
// keyword that only appears in the prose still surfaces the right tab.
type NavItem = { id: string; label: string; body?: string };
type Nav = { group: string; items: NavItem[] }[];

// Escape a user string so it can't break the DOM walk below (we only use it for
// case-insensitive indexOf, but keep it defensive).
const MIN_LEN = 2;

export function DocsSidebar({ nav }: { nav: Nav }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  // Filter the nav: keep items whose label, group, or body text contains the
  // query. This is what makes the matching *tab* show up for a content keyword.
  const groups = nav
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          !query ||
          it.label.toLowerCase().includes(query) ||
          g.group.toLowerCase().includes(query) ||
          (it.body ?? "").toLowerCase().includes(query),
      ),
    }))
    .filter((g) => g.items.length > 0);

  // Highlight every occurrence of the query inside the rendered docs content
  // (#docs-content) by wrapping matches in <mark class="doc-hl">, and scroll the
  // first hit into view. Runs whenever the query changes.
  useEffect(() => {
    const root = document.getElementById("docs-content");
    if (!root) return;

    // 1) Remove any previous highlights, merging the text back together.
    root.querySelectorAll("mark[data-doc-hl]").forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent ?? ""), m);
      parent.normalize();
    });

    if (query.length < MIN_LEN) return;

    // 2) Collect the visible text nodes under the content root.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const textNodes: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n as Text);

    // 3) Wrap each match in a <mark>. Track the first one so we can scroll to it.
    let first: HTMLElement | null = null;
    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue ?? "";
      const lower = text.toLowerCase();
      if (!lower.includes(query)) return;

      const frag = document.createDocumentFragment();
      let cursor = 0;
      let pos = lower.indexOf(query);
      while (pos !== -1) {
        if (pos > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, pos)));
        const mark = document.createElement("mark");
        mark.setAttribute("data-doc-hl", "");
        mark.className = "doc-hl";
        mark.textContent = text.slice(pos, pos + query.length);
        if (!first) first = mark;
        frag.appendChild(mark);
        cursor = pos + query.length;
        pos = lower.indexOf(query, cursor);
      }
      if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
      textNode.parentNode?.replaceChild(frag, textNode);
    });

    if (first) (first as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
  }, [query]);

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

        {query.length >= MIN_LEN && (
          <p className="mt-2 text-xs text-dim">Matches are highlighted in the page.</p>
        )}

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
