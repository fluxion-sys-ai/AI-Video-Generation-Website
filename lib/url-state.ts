"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keep one piece of screen state in the address bar.
 *
 * Tabs were readable from the URL and not writable to it: you could be sent to
 * `/library?tab=uploaded`, but clicking through to Generated left the address
 * bar saying `uploaded`, so reloading undid the click and the link you copied
 * described a screen you were no longer looking at. State somebody can see is
 * state they will try to share.
 *
 * `replace` rather than `push` on purpose: a tab is a view of one page, not a
 * place of its own, and pushing means Back walks every tab somebody tried
 * before it leaves the page. The default value is left out of the URL, so the
 * plain address is the plain screen.
 */
export function useUrlParam(key: string, value: string, fallback: string) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const current = search.get(key);
    const wanted = value === fallback ? null : value;
    if (current === wanted) return;
    const next = new URLSearchParams(search.toString());
    if (wanted === null) next.delete(key);
    else next.set(key, wanted);
    const query = next.toString();
    // scroll: false - changing a tab should not throw the reader back to the
    // top of a page they are already reading.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, value, fallback, pathname, router, search]);
}
