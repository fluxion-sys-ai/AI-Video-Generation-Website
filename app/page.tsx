import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelMarquee } from "@/components/model-marquee";
import { Reveal } from "@/components/reveal";

function Kicker({ label }: { label: string }) {
  return (
    <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
      {label}
    </span>
  );
}

const BASE = process.env.NODE_ENV === "production" ? "/AI-Video-Generation-Website" : "";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Cohesive fixed background — home only */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <img src={`${BASE}/backdrop.svg`} alt="" className="h-full w-full object-cover" />
      </div>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden lg:min-h-[640px]">
        <div className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,189,242,0.24)] bg-[#101E36] px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.08em] text-[#9FB2CC]">
              Text-to-video, image-to-video
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-jetbrains)] text-5xl font-semibold uppercase leading-[0.98] tracking-[-0.01em] sm:text-7xl">
              AI video<br />generation
            </h1>
            <p className="mt-6 max-w-md text-lg text-[#9FB2CC]">
              Pick a model, describe the shot, and generate. Download or export the result.
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-[10px] bg-[#7CBDF2] px-6 py-3 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8] sm:w-auto"
              >
                Get started
              </Link>
              <a
                href="#models"
                className="w-full rounded-[10px] border border-[rgba(124,189,242,0.24)] px-6 py-3 text-center font-medium text-[#E9F1FB] transition-colors hover:bg-[#101E36] sm:w-auto"
              >
                Explore models
              </a>
            </div>
          </div>
        </div>

        {/* Vertical demo video — flush to the right edge, glows as dots pass its left edge */}
        <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block">
          <video
            className="phone-glow aspect-[9/16] w-[340px] rounded-l-[14px] border border-r-0 border-[rgba(255,193,94,0.35)] bg-black object-cover"
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
      </section>

      {/* Models showcase */}
      <section id="models" className="scroll-mt-24 py-20">
        <Reveal className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Kicker label="Models" />
              <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
                Explore our models
              </h2>
              <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />
            </div>
            <Link href="/models" className="hidden text-sm text-[#9FB2CC] transition-colors hover:text-[#F5C46B] sm:block">
              View all
            </Link>
          </div>
        </Reveal>
        <div className="mt-10">
          <ModelMarquee />
        </div>
      </section>

      {/* Walkthrough */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <Kicker label="Walkthrough" />
          <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
            See it in action
          </h2>
          <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />
          <p className="mt-4 max-w-xl text-[#9FB2CC]">
            Watch a prompt become a finished video in under a minute.
          </p>
          <div className="mt-8 overflow-hidden rounded-[10px] bg-black">
            <video
              className="aspect-video w-full object-cover"
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg"
              controls
              preload="metadata"
              playsInline
            />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
