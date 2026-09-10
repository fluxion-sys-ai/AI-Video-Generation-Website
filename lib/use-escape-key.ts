import { useEffect, useRef } from "react";

// Run a handler whenever Escape is pressed. The handler is kept in a ref so the
// listener is attached once (no re-subscribe churn). Consumers typically close
// whatever overlay is open.
export function useEscapeKey(handler: () => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") ref.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
