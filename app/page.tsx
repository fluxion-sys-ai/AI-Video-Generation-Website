import Link from "next/link";

/* Fluxion icon — three lines converging on a gold node */
function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M3 9 Q 16 16 29 9" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M3 16 L 29 16" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M3 23 Q 16 16 29 23" stroke="#7CBDF2" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
      <circle cx="16" cy="16" r="1.6" fill="#D9A45E" />
    </svg>
  );
}

/* Exact Fluxion wordmark: icon + "fluxion" (Sora) + boxed mono "AI VIDEO" */
function Brand({ mark = "h-[27px] w-[27px]" }: { mark?: string }) {
  return (
    <Link href="/" className="flex items-center gap-[11px] text-[#E9F1FB]">
      <LogoMark className={mark} />
      <span className="flex items-baseline gap-2 font-[family-name:var(--font-sora)] text-[19px] font-medium tracking-[-0.02em]">
        fluxion
        <span className="relative -top-[2px] rounded-[4px] border border-[rgba(148,170,200,0.3)] px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[11px] tracking-[0.08em] text-[#A9BBD4]">
          AI VIDEO
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A1322] text-[#E9F1FB]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[rgba(124,189,242,0.14)] bg-[#0A1322]/80 backdrop-blur">
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Brand />
            <div className="hidden items-center gap-7 text-base text-[#A9BBD4] md:flex">
              <Link href="/generate" className="transition-colors hover:text-[#E9F1FB]">Generate</Link>
              <Link href="/models" className="transition-colors hover:text-[#E9F1FB]">Models</Link>
              <Link href="/pricing" className="transition-colors hover:text-[#E9F1FB]">Pricing</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-base">
            <Link href="/login" className="hidden text-[#A9BBD4] transition-colors hover:text-[#E9F1FB] sm:block">Log in</Link>
            <Link href="/signup" className="rounded-[10px] bg-[#7CBDF2] px-5 py-2.5 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8]">Sign up</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src="/backdrop.svg" alt="" aria-hidden="true"
             className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="relative mx-auto max-w-6xl px-6 py-28 text-left sm:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,189,242,0.24)] bg-[rgba(124,189,242,0.06)] px-3 py-1 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.08em] text-[#A9BBD4]">
            AI video, generated on your terms
          </span>
          <h1 className="mt-6 font-[family-name:var(--font-sora)] text-4xl font-medium leading-tight tracking-[-0.025em] sm:text-6xl">
            Turn a prompt into<br /><span className="text-[#7CBDF2]">cinematic video</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#A9BBD4]">
            Choose a model, describe your shot, and generate. Clean flow, premium output,
            no creative-suite bloat.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            <Link href="/generate"
                  className="w-full rounded-[10px] bg-[#7CBDF2] px-6 py-3 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8] sm:w-auto">
              Generate Video
            </Link>
            <Link href="/models"
                  className="w-full rounded-[10px] border border-[rgba(124,189,242,0.24)] px-6 py-3 font-medium text-[#E9F1FB] transition-colors hover:bg-[rgba(124,189,242,0.06)] sm:w-auto">
              Explore Models
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { t: "Any model", d: "Swap between video models with clear, honest capability cards." },
            { t: "One clean flow", d: "Prompt, options, generate. The video stays the focus." },
            { t: "Export ready", d: "Choose format, resolution and FPS, then export in a click." },
          ].map((f) => (
            <div key={f.t} className="rounded-[10px] border border-[rgba(124,189,242,0.14)] bg-[#16263F] p-6">
              <div className="mb-3"><LogoMark className="h-6 w-6" /></div>
              <h3 className="font-[family-name:var(--font-sora)] font-medium">{f.t}</h3>
              <p className="mt-2 text-sm text-[#A9BBD4]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(124,189,242,0.14)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#6E82A0] sm:flex-row">
          <Brand mark="h-5 w-5" />
          <p>© {new Date().getFullYear()} — Frontend demo. No real generation.</p>
        </div>
      </footer>
    </div>
  );
}
