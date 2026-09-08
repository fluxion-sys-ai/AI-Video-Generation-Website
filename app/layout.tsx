import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Fluxion AI Video",
  description: "AI video generator. Choose a model, write a prompt, generate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-[#0A1322] text-[#E9F1FB] font-[family-name:var(--font-geist-sans)]">
        {/* Cohesive fixed background — stays put while the page scrolls over it */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
          <img src="/backdrop.svg" alt="" className="h-full w-full object-cover opacity-60" />
        </div>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
