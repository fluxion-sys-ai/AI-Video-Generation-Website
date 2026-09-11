import type { Metadata } from "next";

// Title-only layout (the page is a client component so it can vary by skin).
export const metadata: Metadata = { title: "Pricing" };

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
