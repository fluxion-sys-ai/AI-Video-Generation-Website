import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Sora, Archivo_Black, Playfair_Display, Caveat, Inter, Space_Grotesk, Outfit, Orbitron, Fraunces, Jost, Quicksand, Manrope } from "next/font/google";
import "./globals.css";
import { Spotlight } from "@/components/spotlight";
import { Toaster } from "@/components/toaster";
import { SkinSwitcher } from "@/components/skin-switcher";
import { CosmosBackdrop } from "@/components/cosmos-backdrop";

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

// Alternate-skin fonts (only take effect under .skin-editorial / .skin-luxury
// via globals.css; see the skin token blocks there).
const archivoBlack = Archivo_Black({ variable: "--font-archivo", subsets: ["latin"], weight: ["400"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "800"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["400", "500", "700"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
// Distinct body/UI faces so each theme has its own type identity (no repeats).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "500", "600"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE = "Fluxion AI Video";
const DESC = "AI video generator, choose a model, write a prompt, and generate.";
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
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${sora.variable} ${archivoBlack.variable} ${playfair.variable} ${caveat.variable} ${inter.variable} ${spaceGrotesk.variable} ${outfit.variable} ${orbitron.variable} ${fraunces.variable} ${jost.variable} ${quicksand.variable} ${manrope.variable} h-full scroll-smooth antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-base text-fg font-[family-name:var(--font-geist-sans)]">
        {/* No-flash theme boot: runs before paint so the correct look is set
            on <html> immediately. Adds `.light` when the saved setting is
            "light", or when it's "system" (or unset defaults to dark, so only
            explicit "system") and the OS currently prefers a light scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('fluxion.theme');if(t==='light'||(t==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches))document.documentElement.classList.add('light');var s=localStorage.getItem('fluxion.skin');if(s==='editorial'||s==='luxury'||s==='playful'||s==='cosmos')document.documentElement.classList.add('skin-'+s)}catch(e){}",
          }}
        />
        <Spotlight />
        <CosmosBackdrop />
        {children}
        <SkinSwitcher />
        <Toaster />
      </body>
    </html>
  );
}
