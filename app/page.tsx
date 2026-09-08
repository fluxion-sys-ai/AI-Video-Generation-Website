import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelCard } from "@/components/model-card";
import { getModels } from "@/lib/models";

export default function Home() {
  const models = getModels();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[rgba(124,189,242,0.14)]">
        <img
          src="/backdrop.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-32 sm:py-44">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,189,242,0.24)] bg-[rgba(124,189,242,0.06)] px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.08em] text-[#A9BBD4]">
            Text-to-video · Image-to-video
          </span>
          <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-sora)] text-5xl font-semibold uppercase leading-[0.98] tracking-[-0.02em] sm:text-7xl">
            AI video<br />generation
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#A9BBD4]">
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
              className="w-full rounded-[10px] border border-[rgba(124,189,242,0.24)] px-6 py-3 text-center font-medium text-[#E9F1FB] transition-colors hover:bg-[rgba(124,189,242,0.06)] sm:w-auto"
            >
              Explore models
            </a>
          </div>
        </div>
      </section>

      {/* Models showcase */}
      <section id="models" className="scroll-mt-24 border-b border-[rgba(124,189,242,0.14)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#7CBDF2]">
                — Models
              </span>
              <h2 className="mt-2 font-[family-name:var(--font-sora)] text-3xl font-medium tracking-[-0.02em]">
                Explore our models
              </h2>
            </div>
            <Link href="/models" className="hidden text-sm text-[#A9BBD4] transition-colors hover:text-[#E9F1FB] sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => (
              <ModelCard key={m.slug} model={m} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
