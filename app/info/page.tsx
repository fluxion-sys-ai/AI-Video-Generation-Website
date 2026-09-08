import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Info · Fluxion AI Video" };

export default function InfoPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="max-w-3xl px-6 py-16">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
          Info
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
          About Fluxion AI Video
        </h1>
        <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />

        <p className="mt-6 text-[#9FB2CC]">
          Fluxion AI Video turns a prompt into video. Choose a model, set your options, and
          generate. This site is a frontend demo, so generation and accounts are mocked.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#E9F1FB]">
              Basics
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#9FB2CC]">
              <li>Text-to-video and image-to-video models</li>
              <li>Adjustable duration, aspect ratio, and resolution</li>
              <li>Credit-based pricing per second of output</li>
              <li>Download or export finished clips</li>
            </ul>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#E9F1FB]">
              Contact us
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#9FB2CC]">
              <li>
                Email:{" "}
                <a href="mailto:example-info@fluxion-sys.ai" className="text-[#7CBDF2] hover:text-[#F5C46B]">
                  hello@fluxion-sys.ai
                </a>
              </li>
              <li>
                Web:{" "}
                <a href="https://fluxion-sys.ai" target="_blank" rel="noopener noreferrer" className="text-[#7CBDF2] hover:text-[#F5C46B]">
                  fluxion-sys.ai
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
