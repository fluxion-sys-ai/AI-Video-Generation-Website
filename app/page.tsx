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

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 sm:py-36 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,189,242,0.24)] bg-[#101E36] px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.08em] text-[#9FB2CC]">
              Text-to-video, image-to-video
            </span>
            <h1 className="mt-6 max-w-2xl font-[family-name:var(--font-jetbrains)] text-5xl font-semibold uppercase leading-[0.98] tracking-[-0.01em] sm:text-7xl">
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

            {/* scrubber / scroll cue */}
            <a href="#models" className="mt-8 inline-flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.12em] text-[#5A6B84] transition-colors hover:text-[#9FB2CC]">
              <svg width="150" height="12" viewBox="0 0 150 12" aria-hidden="true">
                <line x1="4" y1="6" x2="146" y2="6" stroke="#26374F" strokeWidth="1" />
                <circle cy="6" r="3" fill="#F5C46B">
                  <animate attributeName="cx" values="4;146;4" dur="4.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
                </circle>
              </svg>
              Scroll
            </a>
          </div>

          {/* Vertical demo video — where the dots land */}
          <div className="hidden justify-self-end lg:block">
            <video
              className="aspect-[9/16] w-[248px] rounded-[12px] border border-[rgba(124,189,242,0.28)] bg-black object-cover shadow-2xl shadow-black/50"
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
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
