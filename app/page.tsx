import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelMarquee } from "@/components/model-marquee";
import { Reveal } from "@/components/reveal";
import { HeroReels } from "@/components/hero-reels";

function Kicker({ label, color = "#E0A24E" }: { label: string; color?: string }) {
  return (
    <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em]" style={{ color }}>
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
      <section className="relative overflow-hidden lg:h-[86vh]">
        <div className="grid h-full items-center gap-10 px-8 py-24 sm:px-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-0">
          <div className="max-w-xl lg:pl-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,189,242,0.24)] bg-[#101E36] px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.08em] text-[#9FB2CC]">
              Text-to-video, image-to-video
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-jetbrains)] text-5xl font-semibold uppercase leading-[0.98] tracking-[-0.01em] sm:text-6xl">
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

          {/* Vertical reels (3 slots) — large block on the right */}
          <div className="hidden justify-self-end lg:block">
            <HeroReels />
          </div>
        </div>
      </section>

      {/* Models showcase */}
      <section id="models" className="scroll-mt-24 pb-20 pt-6">
        <Reveal className="px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Kicker label="Models" />
              <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
                Explore our models
              </h2>
              <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />
            </div>
            <Link href="/models" className="hidden shrink-0 text-sm text-[#9FB2CC] transition-colors hover:text-[#F5C46B] sm:block">
              View all
            </Link>
          </div>
        </Reveal>
        <div className="mt-10">
          <ModelMarquee />
        </div>
      </section>

      {/* Walkthrough */}
      <section className="px-8 py-20">
        <Reveal className="mx-auto max-w-4xl text-center">
          <Kicker label="Walkthrough" color="#4EC98F" />
          <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
            See it in action
          </h2>
          <span className="mx-auto mt-3 block h-px w-10 bg-[#4EC98F]" />
          <p className="mx-auto mt-4 max-w-xl text-[#9FB2CC]">
            Watch a prompt become a finished video in under a minute.
          </p>
          <div className="mt-8 mx-auto max-w-4xl overflow-hidden rounded-[10px] bg-black">
            <video
              className="aspect-video w-full object-cover"
              src={`${BASE}/demos/walkthrough.mp4`}
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
