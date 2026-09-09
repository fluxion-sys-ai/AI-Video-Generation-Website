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
const label = "mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]";
const card = "rounded-[12px] border border-[#2E466B] bg-[#0B1524] p-5";
const btnPrimary = "rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 text-sm font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]";
const btnGhost = "rounded-[10px] border border-[rgba(124,189,242,0.24)] px-5 py-2.5 text-sm text-[#E9F1FB] transition-colors hover:bg-[rgba(124,189,242,0.06)]";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-[#4EC98F]" : "bg-[#243A57]"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className={card}>
      <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">{title}</p>
      <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-[#E9F1FB]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#6E82A0]">{sub}</p>}
    </div>
  );
}

function mockHistory() {
  const models = getModels();
  const prompts = [
    "Aerial pull-back over a coastal town at golden hour",
    "Close-up of rain on a neon-lit window, slow motion",
    "A paper boat drifting down a rushing gutter",
    "Timelapse of clouds over a mountain ridge",
  ];
  const when = ["2h ago", "Yesterday", "3 days ago", "Last week"];
  return prompts.map((p, i) => {
    const m = models[i % models.length];
    return { id: i, prompt: p, model: m.name, slug: m.slug, poster: m.poster, when: when[i] };
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"account" | "billing" | "usage">("account");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  // billing (mock)
  const [autoTopup, setAutoTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(25);
  const [spendLimit, setSpendLimit] = useState(100);
  const [alertOn, setAlertOn] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/profile");
      return;
    }
    const u = getUser();
    if (u) {
      setName(u.name);
      setUsername(u.username);
      setEmail(u.email);
    }
    setReady(true);
  }, [router]);

  function save() {
    setUser({ name: name.trim() || "Creator", username: username.trim() || "creator", email });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }
  function out() {
    signOut();
    router.push("/");
  }
  function del() {
    if (confirm("Delete your account? This can't be undone.")) {
      signOut();
      router.push("/");
    }
  }

  const history = mockHistory();

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        {ready && (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF8A1E] font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-[#0A1322]">
                {name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">{name}</h1>
                <p className="text-sm text-[#9FB2CC]">@{username} · {email}</p>
              </div>
            </div>

            <div className="mt-8 flex gap-6 border-b border-[rgba(124,189,242,0.14)] font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em]">
              {(["account", "billing", "usage"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-3 transition-colors ${
                    tab === t ? "border-[#FF8A1E] text-[#FF8A1E]" : "border-transparent text-[#9FB2CC] hover:text-[#E9F1FB]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ACCOUNT */}
            {tab === "account" && (
              <div className="mt-8 space-y-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label}>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={label}>Username</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={save} className={btnPrimary}>Save changes</button>
                  {saved && <span className="text-sm text-[#4EC98F]">Saved ✓</span>}
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-[rgba(124,189,242,0.14)] pt-6">
                  <button onClick={out} className={btnGhost}>Sign out</button>
                  <button onClick={del} className="rounded-[10px] border border-[rgba(255,107,107,0.4)] px-5 py-2.5 text-sm text-[#FF6B6B] transition-colors hover:bg-[rgba(255,107,107,0.08)]">
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* BILLING */}
            {tab === "billing" && (
              <div className="mt-8 space-y-6">
                <div className={card}>
                  <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Current balance</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-semibold text-[#FF8A1E]">$0.00</p>
                  <p className="mt-1 text-xs text-[#6E82A0]">Balance may lag recent usage by up to an hour.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setAddOpen(true)} className={btnPrimary}>Add credits</button>
                    <button onClick={() => setAddOpen(true)} className={btnGhost}>Buy credits</button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Stat title="Credits expiring in 30 days" value="$0.00" sub="See details" />
                  <Stat title="Usage this month" value="$0.00" sub="$0.00 daily average" />
                </div>

                {/* auto top-up */}
                <div className={card}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#E9F1FB]">Auto top-up</p>
                      <p className="text-xs text-[#6E82A0]">Automatically buy credits when your balance runs low.</p>
                    </div>
                    <Toggle on={autoTopup} onClick={() => setAutoTopup((v) => !v)} />
                  </div>
                  {autoTopup && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={label}>Top-up amount ($)</label>
                        <input type="number" min={5} value={topupAmount} onChange={(e) => setTopupAmount(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={label}>Monthly spend limit ($)</label>
                        <input type="number" min={0} value={spendLimit} onChange={(e) => setSpendLimit(Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>
                  )}
                </div>

                {/* low-balance alert */}
                <div className={card}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#E9F1FB]">Low-balance email alert</p>
                      <p className="text-xs text-[#6E82A0]">Email me when my balance falls below this amount.</p>
                    </div>
                    <Toggle on={alertOn} onClick={() => setAlertOn((v) => !v)} />
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <div>
                      <label className={label}>Threshold ($)</label>
                      <input type="number" min={0} value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} className={`${inputClass} w-28`} disabled={!alertOn} />
                    </div>
                    <button className={btnGhost}>Update</button>
                    <span className="pb-2.5 text-xs text-[#6E82A0]">{alertOn ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>

                <p className="text-xs text-[#6E82A0]">Billing period: Sep 1 – Sep 30, 2026 · frontend demo, no real charges.</p>
              </div>
            )}

            {/* USAGE */}
            {tab === "usage" && (
              <div className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Stat title="Current invoice due" value="$0.00" sub="View invoices" />
                  <Stat title="Current credit balance" value="$0.00" sub="May lag recent usage" />
                  <Stat title="Usage before discounts (subtotal)" value="$0.00" sub="Selected period" />
                  <Stat title="Daily burn" value="$0.00" sub="Average over period" />
                  <Stat title="Model API usage" value="$0.00" sub="This period" />
                  <Stat title="Discounts applied" value="$0.00" sub="This period" />
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

      {/* Add credits modal (mock) */}
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-sm rounded-[14px] border border-[#2E466B] bg-[#0B1524] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Add credits</h3>
            <p className="mt-1 text-xs text-[#6E82A0]">Choose an amount. Frontend demo — no real charge.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[10, 25, 50].map((a) => (
                <button key={a} className="rounded-[10px] border border-[rgba(124,189,242,0.24)] py-3 font-[family-name:var(--font-jetbrains)] text-sm hover:border-[#FF8A1E] hover:text-[#FF8A1E]">
                  ${a}
                </button>
              ))}
            </div>
            <button onClick={() => setAddOpen(false)} className={`${btnPrimary} mt-5 w-full`}>Buy credits</button>
          </div>
        </div>
      )}
    </div>
  );
}
