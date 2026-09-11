import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GlowBlobs } from "@/components/decor/glow-blobs";
import { PlansDots } from "@/components/decor/plans-dots";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="c" className="decor-invert pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-[family-name:var(--font-jetbrains)] text-[7rem] font-semibold leading-none tracking-[-0.03em] text-fg-strong/[0.08] sm:text-[10rem]">
          404
        </p>
        <h1 className="-mt-6 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.02em] text-fg-strong sm:text-4xl">
          Lost the thread
        </h1>
        <p className="mt-3 max-w-md text-muted">
          This page didn&apos;t render. It might have moved, or never existed. Let&apos;s get you back to something that generates.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-none bg-accent px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm font-medium uppercase tracking-[0.04em] text-ink transition-colors hover:bg-accent-hover"
          >
            Back home
          </Link>
          <Link
            href="/models"
            className="rounded-none border border-hairline-strong px-6 py-3 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.04em] text-fg transition-colors hover:bg-hover"
          >
            Explore models
          </Link>
        </div>
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
