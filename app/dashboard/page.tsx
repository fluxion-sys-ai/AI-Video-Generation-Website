"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { UsageChart } from "@/components/usage-chart";
import { isSignedIn, getUser } from "@/lib/auth";
import { getModels } from "@/lib/models";

const tile = "border border-[#2E466B] p-5 transition-colors hover:border-[rgba(124,189,242,0.5)]";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/dashboard");
      return;
    }
    setName(getUser()?.name || "Creator");
    setReady(true);
  }, [router]);

  const models = getModels();
  const recent = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
  ].map((prompt, i) => ({ id: i, prompt, model: models[i % models.length], when: ["2h ago", "Yesterday", "3 days ago"][i] }));

  if (!ready) return <div className="min-h-screen" />;

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-8 py-10">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">Dashboard</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-sm text-[#9FB2CC]">Pick up where you left off or start something new.</p>

        {/* quick actions */}
        <div className="mt-8 grid gap-px border-b border-r border-[#2E466B] sm:grid-cols-3">
          <Link href="/models" className="group border-l border-t border-[#2E466B] p-6">
            <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] text-[#FF8A1E]">New generation</p>
            <p className="mt-2 text-sm text-[#9FB2CC]">Choose a model and describe your shot.</p>
          </Link>
          <Link href="/library" className="group border-l border-t border-[#2E466B] p-6">
            <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] text-[#7CBDF2]">Library</p>
            <p className="mt-2 text-sm text-[#9FB2CC]">Your generated videos and uploads.</p>
          </Link>
          <Link href="/profile?tab=billing" className="group border-l border-t border-[#2E466B] p-6">
            <p className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] text-[#E0A24E]">Add credits</p>
            <p className="mt-2 text-sm text-[#9FB2CC]">Top up your pay-as-you-go balance.</p>
          </Link>
        </div>

        {/* stats + usage */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="border border-[#2E466B] p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Daily usage</p>
              <p className="text-xs text-[#6E82A0]">Last 20 days</p>
            </div>
            <UsageChart className="mt-4" plotHeight={150} />
          </div>
          <div className="grid grid-cols-2 gap-px border-b border-r border-[#2E466B]">
            {[
              ["Credit balance", "$0.00"],
              ["Generations", "0"],
              ["This month", "$0.00"],
              ["Saved models", String(models.length)],
            ].map(([t, v]) => (
              <div key={t} className="border-l border-t border-[#2E466B] p-5">
                <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">{t}</p>
                <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* recent */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Recent generations</h2>
            <Link href="/library" className="text-sm text-[#7CBDF2] transition-colors hover:text-[#F5C46B]">View all</Link>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {recent.map((r) => (
              <Link key={r.id} href={`/generate?model=${r.model.slug}`} className={tile}>
                <div className="aspect-video w-full overflow-hidden bg-black">
                  <img src={r.model.poster} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-3 truncate text-sm text-[#E9F1FB]">{r.prompt}</p>
                <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-[#E0A24E]">
                  {r.model.name} · {r.when}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
