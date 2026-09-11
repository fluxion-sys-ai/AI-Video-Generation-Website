import type { Metadata } from "next";

// Title-only layout (the page is a client component). Inherits the root
// "%s · Fluxion AI Video" template.
export const metadata: Metadata = { title: "Profile" };

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
