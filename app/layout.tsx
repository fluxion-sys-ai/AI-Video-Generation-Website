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
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('fluxion.theme')==='light')document.documentElement.classList.add('light')}catch(e){}",
          }}
        />
        <Spotlight />
        {children}
      </body>
    </html>
  );
}
