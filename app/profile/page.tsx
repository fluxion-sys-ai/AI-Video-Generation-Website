"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { isSignedIn, getUser, setUser, signOut } from "@/lib/auth";
import { getModels } from "@/lib/models";

const inputClass =
  "w-full rounded-[8px] border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] outline-none focus:border-[#7CBDF2] focus:ring-1 focus:ring-[#7CBDF2]";

// mock account state
const PLAN = "Free";
const CREDITS_USED = 320;
const CREDITS_TOTAL = 2000;

function mockHistory() {
  const models = getModels();
  const prompts = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
    "Timelapse of clouds over a mountain ridge",
  ];
  const days = ["2h ago", "Yesterday", "3 days ago", "Last week"];
  return prompts.map((p, i) => {
    const m = models[i % models.length];
    return { id: i, prompt: p, model: m.name, slug: m.slug, poster: m.poster, when: days[i] };
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"account" | "usage">("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/profile");
      return;
    }
    const u = getUser();
    if (u) {
      setName(u.name);
      setEmail(u.email);
    }
    setReady(true);
  }, [router]);

  function save() {
    setUser({ name: name.trim() || "Creator", email });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }
  function out() {
    signOut();
    router.push("/");
  }

  const history = mockHistory();
  const pct = Math.round((CREDITS_USED / CREDITS_TOTAL) * 100);

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        {ready && (
          <>
            {/* header */}
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF8A1E] font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-[#0A1322]">
                {name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">
                  {name}
                </h1>
                <p className="text-sm text-[#9FB2CC]">{email}</p>
              </div>
            </div>

            {/* tabs */}
            <div className="mt-8 flex gap-6 border-b border-[rgba(124,189,242,0.14)] font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
              {(["account", "usage"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-3 transition-colors ${
                    tab === t ? "border-[#FF8A1E] text-[#FF8A1E]" : "border-transparent text-[#9FB2CC] hover:text-[#E9F1FB]"
                  }`}
                >
                  {t === "account" ? "Account" : "Usage & history"}
                </button>
              ))}
            </div>

            {/* ACCOUNT */}
            {tab === "account" && (
              <div className="mt-8 space-y-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={save}
                    className="rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 text-sm font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]"
                  >
                    Save changes
                  </button>
                  {saved && <span className="text-sm text-[#4EC98F]">Saved ✓</span>}
                </div>

                {/* plan */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#2E466B] bg-[#0B1524] p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Current plan</p>
                    <p className="mt-1 font-[family-name:var(--font-jetbrains)] text-xl uppercase text-[#E9F1FB]">{PLAN}</p>
                  </div>
                  <Link
                    href="/pricing"
                    className="rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 text-sm font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]"
                  >
                    Upgrade plan
                  </Link>
                </div>

                <button onClick={out} className="text-sm text-[#9FB2CC] transition-colors hover:text-[#FF8A1E]">
                  Sign out
                </button>
              </div>
            )}

            {/* USAGE & HISTORY */}
            {tab === "usage" && (
              <div className="mt-8 space-y-8">
                <div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[#C7D4E6]">Credits used this month</span>
                    <span className="font-[family-name:var(--font-jetbrains)] text-[#FFB020]">
                      {CREDITS_USED.toLocaleString()} / {CREDITS_TOTAL.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#101E36]">
                    <div className="h-full rounded-full bg-[#FF8A1E]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-[#6E82A0]">Resets on the 1st. {CREDITS_TOTAL - CREDITS_USED} credits left.</p>
                </div>

                <div>
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">
                    Generation history
                  </h2>
                  <div className="mt-4 space-y-3">
                    {history.map((h) => (
                      <Link
                        key={h.id}
                        href={`/generate?model=${h.slug}`}
                        className="flex items-center gap-4 rounded-[10px] border border-[#2E466B] bg-[#0B1524] p-3 transition-colors hover:border-[rgba(124,189,242,0.4)]"
                      >
                        <img src={h.poster} alt="" className="h-12 w-20 shrink-0 rounded-[6px] bg-black object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[#E9F1FB]">{h.prompt}</p>
                          <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-[#E0A24E]">
                            {h.model} · {h.when}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
