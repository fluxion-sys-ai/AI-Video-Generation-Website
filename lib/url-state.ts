"use client";

import { useEffect, useRef } from "react";
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
 *
 * On arrival the URL leads and the screen follows. A page opened at
 * `?files=document` renders once with whatever its state defaults to, and this
 * hook ran first and deleted the parameter for disagreeing with that default -
 * so the screen read an address it had already erased, and a shared link
 * opened the plain page. Until the screen has adopted the value once, this
 * will not remove one.
 */
export function useUrlParam(key: string, value: string, fallback: string) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  // The last value this screen reported. Null until the first run, which is
  // how "the screen changed this" is told apart from "the screen has not
  // looked yet" - and the difference decides whether a parameter may be
  // erased.
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const current = search.get(key);
    const wanted = value === fallback ? null : value;
    const changed = reported.current !== null && reported.current !== value;
    reported.current = value;
    if (current === wanted) return;
    // Only a person may remove a parameter. On arrival the screen is at its
    // default and the address is not, and erasing on that disagreement is how
    // a shared link opened the plain page - including through a render where
    // the parameters are not readable yet, which a static export has before it
    // hydrates and which defeated the first attempt at this.
    if (wanted === null && !changed) return;
    const next = new URLSearchParams(search.toString());
    if (wanted === null) next.delete(key);
    else next.set(key, wanted);
    const query = next.toString();
    // scroll: false - changing a tab should not throw the reader back to the
    // top of a page they are already reading.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, value, fallback, pathname, router, search]);
}
