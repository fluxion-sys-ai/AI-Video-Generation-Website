import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { Spotlight } from "@/components/spotlight";

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

export const metadata: Metadata = {
  title: "Fluxion AI Video",
  description: "AI video generator. Choose a model, write a prompt, generate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
      </body>
    </html>
  );
}
