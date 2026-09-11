import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";

export const metadata = { title: "Info & contact" };

const FEATURES: { icon: React.ReactNode; h: string; b: string }[] = [
  { icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>, h: "Text & image to video", b: "Start from a prompt or animate a still, a model for every kind of shot." },
  { icon: <><path d="M4 7h16M4 12h16M4 17h10" /></>, h: "Real controls", b: "Duration, aspect ratio, resolution, seed and audio, dial in exactly what you need." },
  { icon: <><path d="M12 3v12M8 11l4 4 4-4M4 19h16" /></>, h: "Export & reuse", b: "Download finished MP4s, or push reference images back into a model's playground." },
  { icon: <><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18" /></>, h: "Pay as you go", b: "No subscriptions. Credit-based pricing per second, priced per model." },
];

const STEPS = [
  ["01", "Pick a model", "Browse the catalog and compare capability, resolution, and price."],
  ["02", "Write a prompt", "Describe the shot, subject, motion, camera, lighting, and set your options."],
  ["03", "Generate & refine", "Preview the result, refine it in chat, then download the finished clip."],
];

const FAQ = [
  ["Is this a real video generator?", "This is a frontend demo, the flows are real, but generation is mocked. See the docs and BACKEND.md for how a real backend plugs in."],
  ["How is pricing calculated?", "Each model has a credits-per-second rate; the estimated dollar figure assumes an illustrative 1 credit ≈ $0.01."],
  ["Do I need an account?", "You can browse freely. Generating and saving to your library ask you to sign in first."],
  ["Which formats can I export?", "MP4 today. WebM and GIF are shown as coming-soon options in the playground."],
];

export default function InfoPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-10 pt-16 text-center">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-gold">About</span>
          <h1 className="mt-3 text-[clamp(34px,5.5vw,60px)] font-medium leading-[1.02] text-fg-strong">Prompt in, video out.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Fluxion is a studio for turning words into motion. Choose a model, compose a prompt, and generate -
            with real controls and a playground built for iteration.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-none bg-accent px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-ink transition-colors hover:bg-accent-hover">Get started</Link>
            <Link href="/models" className="rounded-none border border-hairline-strong px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-fg transition-colors hover:bg-hover">Explore models</Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.h} className="rounded-[10px] border border-line bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-accent-border bg-accent-soft text-accent-ink">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </span>
                <h2 className="mt-4 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg-strong">{f.h}</h2>
                <p className="mt-2 text-sm text-muted">{f.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-center font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.1em] text-muted">How it works</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map(([n, h, b]) => (
              <div key={n}>
                <span className="font-[family-name:var(--font-jetbrains)] text-4xl font-bold text-fg-strong/20">{n}</span>
                <h3 className="mt-2 font-[family-name:var(--font-jetbrains)] text-base uppercase tracking-[0.04em] text-fg-strong">{h}</h3>
                <p className="mt-2 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ + contact */}
        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.1em] text-muted">FAQ</h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-4">
                  <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.02em] text-fg-strong">{q}</p>
                  <p className="mt-2 text-sm text-muted">{a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-fit rounded-[10px] border border-line bg-surface p-6">
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-fg-strong">Get in touch</h2>
            <p className="mt-2 text-sm text-muted">Questions, partnerships, or press, we&apos;d love to hear from you.</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-dim">Email</dt>
                <dd><a href="mailto:hello@fluxion-sys.ai" className="text-blue hover:text-gold-soft">hello@fluxion-sys.ai</a></dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-dim">Web</dt>
                <dd><a href="https://fluxion-sys.ai" target="_blank" rel="noopener noreferrer" className="text-blue hover:text-gold-soft">fluxion-sys.ai</a></dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.06em] text-dim">Docs</dt>
                <dd><Link href="/docs" className="text-blue hover:text-gold-soft">API & guides</Link></dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <div className="relative z-10"><SiteFooter /></div>
    </div>
  );
}
