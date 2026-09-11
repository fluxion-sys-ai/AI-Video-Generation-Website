import type { Metadata } from "next";

// The page is a client component (can't export metadata itself), so this
// title-only layout sets the browser-tab title server-side (no flash). It
// inherits the "%s · Fluxion AI Video" template from the root layout.
export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
