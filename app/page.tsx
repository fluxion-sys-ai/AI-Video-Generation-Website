import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelMarquee } from "@/components/model-marquee";
import { Reveal } from "@/components/reveal";
import { HeroReels } from "@/components/hero-reels";
import { Stats } from "@/components/stats";
import { ModelPricingTable } from "@/components/model-pricing-table";
import { HeroSpotlight } from "@/components/hero-spotlight";

function Kicker({ label, color = "#E0A24E" }: { label: string; color?: string }) {
  return (
    <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em]" style={{ color }}>
      {label}
    </span>
  );
}

// Section heading with a big faded index number behind it.
function SectionHeading({
  index,
  label,
  title,
  color = "#E0A24E",
  center = false,
}: {
  index: string;
  label: string;
  title: string;
  color?: string;
  center?: boolean;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-12 select-none font-[family-name:var(--font-jetbrains)] text-8xl font-bold leading-none text-white/[0.05] ${
          center ? "left-1/2 -translate-x-1/2" : "-left-1"
        }`}
      >
        {index}
      </span>
      <div className="relative">
        <Kicker label={label} color={color} />
        <h2 className="mt-2 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
          {title}
        </h2>
        <span className={`mt-3 block h-px w-10 ${center ? "mx-auto" : ""}`} style={{ background: color }} />
      </div>
    </div>
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
      <section className="relative overflow-hidden lg:h-[68vh]">
        <HeroSpotlight />
        <div className="relative z-10 grid h-full items-center gap-10 px-8 py-20 sm:px-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-0">
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
                className="w-full rounded-[10px] bg-[#FF8A1E] px-6 py-3 font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45] sm:w-auto"
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

      {/* Stats */}
      <Stats />

      {/* Models showcase */}
      <section id="models" className="scroll-mt-24 pb-20 pt-14">
        <Reveal className="px-8">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading index="01" label="Models" title="Explore our models" />
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
          <SectionHeading index="02" label="Walkthrough" title="See it in action" color="#4EC98F" center />
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

      {/* Per-model pricing */}
      <section className="px-8 pb-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="text-center">
            <SectionHeading index="03" label="Pricing" title="Per-model pricing" color="#FFB020" center />
            <p className="mx-auto mt-4 max-w-xl text-[#9FB2CC]">
              Pay by the second in credits. Predictable, and priced per model.
            </p>
          </div>
          <div className="mt-8">
            <ModelPricingTable />
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/pricing"
              className="rounded-[10px] border border-[rgba(124,189,242,0.24)] px-6 py-3 font-medium text-[#E9F1FB] transition-colors hover:bg-[#101E36]"
            >
              See all plans
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
