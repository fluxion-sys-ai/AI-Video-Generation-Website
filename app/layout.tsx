import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { Spotlight } from "@/components/spotlight";
import { Toaster } from "@/components/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Sora is used only for the Fluxion logo wordmark (matches the corporate site).
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500"],
});

const SITE = "Fluxion AI Video";
const DESC = "AI video generator — choose a model, write a prompt, and generate.";
const SITE_URL = "https://fluxion-sys-ai.github.io/AI-Video-Generation-Website/";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE, template: `%s · ${SITE}` },
  description: DESC,
  applicationName: SITE,
  openGraph: {
    type: "website",
    siteName: SITE,
    title: SITE,
    description: DESC,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE,
    description: DESC,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${sora.variable} h-full scroll-smooth antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-base text-fg font-[family-name:var(--font-geist-sans)]">
        {/* No-flash theme boot: runs before paint so the correct look is set
            on <html> immediately. Adds `.light` when the saved setting is
            "light", or when it's "system" (or unset defaults to dark, so only
            explicit "system") and the OS currently prefers a light scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('fluxion.theme');if(t==='light'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches))document.documentElement.classList.add('light')}catch(e){}",
          }}
        />
        <Spotlight />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
