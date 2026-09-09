"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { isSignedIn } from "@/lib/auth";
import { getModels } from "@/lib/models";

const inputClass =
  "w-full rounded-none border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] outline-none focus:border-[#7CBDF2]";
const label = "mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]";
const btnPrimary = "rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 text-sm font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-[#FF8A1E]" : "bg-[#243A57]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  const models = getModels();
  const [defaultModel, setDefaultModel] = useState(models[0].slug);
  const [defaultRes, setDefaultRes] = useState("720p");
  const [theme, setTheme] = useState("Dark");
  const [autoplay, setAutoplay] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/settings");
      return;
    }
    setReady(true);
  }, [router]);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  if (!ready) return <div className="min-h-screen" />;

  const model = models.find((m) => m.slug === defaultModel) || models[0];

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full max-w-3xl flex-1 px-8 py-10">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">Settings</span>
        <h1 className="mt-1 font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">Settings</h1>
        <p className="mt-2 text-sm text-[#9FB2CC]">Preferences for how the app looks and generates.</p>

        {/* Appearance */}
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Appearance</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label}>Theme</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)} className={inputClass}>
                {["Dark", "Midnight", "System"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-4 border border-[#2E466B] p-4">
              <div>
                <p className="text-sm text-[#E9F1FB]">Autoplay previews</p>
                <p className="text-xs text-[#6E82A0]">Play video thumbnails on hover.</p>
              </div>
              <Toggle on={autoplay} onClick={() => setAutoplay((v) => !v)} />
            </div>
            <div className="flex items-center justify-between gap-4 border border-[#2E466B] p-4">
              <div>
                <p className="text-sm text-[#E9F1FB]">Reduce motion</p>
                <p className="text-xs text-[#6E82A0]">Dim background animations.</p>
              </div>
              <Toggle on={reduceMotion} onClick={() => setReduceMotion((v) => !v)} />
            </div>
          </div>
        </section>

        {/* Generation defaults */}
        <section className="mt-8 border-t border-[rgba(124,189,242,0.14)] pt-6">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Generation defaults</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label}>Default model</label>
              <select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} className={inputClass}>
                {models.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Default resolution</label>
              <select value={defaultRes} onChange={(e) => setDefaultRes(e.target.value)} className={inputClass}>
                {model.resolutions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="mt-8 border-t border-[rgba(124,189,242,0.14)] pt-6">
          <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Notifications</h2>
          <div className="mt-4 flex items-center justify-between gap-4 border border-[#2E466B] p-4">
            <div>
              <p className="text-sm text-[#E9F1FB]">Product email updates</p>
              <p className="text-xs text-[#6E82A0]">Occasional news about new models and features.</p>
            </div>
            <Toggle on={emailUpdates} onClick={() => setEmailUpdates((v) => !v)} />
          </div>
        </section>

        <div className="mt-8 flex items-center gap-3">
          <button onClick={save} className={btnPrimary}>Save settings</button>
          {saved && <span className="text-sm text-[#FF8A1E]">Saved ✓</span>}
          <Link href="/profile" className="ml-2 text-sm text-[#7CBDF2] transition-colors hover:text-[#F5C46B]">Account &amp; billing</Link>
        </div>
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
