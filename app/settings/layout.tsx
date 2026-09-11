import type { Metadata } from "next";

// Title-only layout (the page is a client component that redirects to
// /profile?tab=preferences). Inherits the root "%s · Fluxion AI Video" template.
export const metadata: Metadata = { title: "Settings" };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
