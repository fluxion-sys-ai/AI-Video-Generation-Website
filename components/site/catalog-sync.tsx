"use client";

// Loads the model catalog from the backend once per page load. Mounted site-wide
// in app/layout.tsx; pages that list models also subscribe with
// useLive("models", refreshCatalog) so they re-render when it arrives.

import { BACKEND_ENABLED } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { refreshCatalog } from "@/lib/models";

export function CatalogSync() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  return null;
}
