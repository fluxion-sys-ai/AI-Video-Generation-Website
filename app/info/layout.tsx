import type { Metadata } from "next";

// Title-only layout (the page is a client component so it can vary per skin).
export const metadata: Metadata = { title: "Info & contact" };

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
