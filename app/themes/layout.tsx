import type { Metadata } from "next";

// Title-only layout (the page is a client component). Inherits the root
// "%s · Fluxion AI Video" template. TEMP — remove with the /themes preview.
export const metadata: Metadata = { title: "Theme concepts" };

export default function ThemesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
