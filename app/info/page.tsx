import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";

export const metadata = { title: "Info · Fluxion AI Video" };

export default function InfoPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-center">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">
          Info
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
          About Fluxion AI Video
        </h1>
        <span className="mx-auto mt-3 block h-px w-10 bg-gold" />

        <p className="mt-6 text-muted">
          Fluxion AI Video turns a prompt into video. Choose a model, set your options, and
          generate.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg">
              Basics
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Text-to-video and image-to-video models</li>
              <li>Adjustable duration, aspect ratio, and resolution</li>
              <li>Credit-based pricing per second of output</li>
              <li>Download or export finished clips</li>
            </ul>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg">
              Contact us
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                Email:{" "}
                <a href="mailto:example-info@fluxion-sys.ai" className="text-blue hover:text-gold-soft">
                  hello@fluxion-sys.ai
                </a>
              </li>
              <li>
                Web:{" "}
                <a href="https://fluxion-sys.ai" target="_blank" rel="noopener noreferrer" className="text-blue hover:text-gold-soft">
                  fluxion-sys.ai
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
