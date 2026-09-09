"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { UsageChart } from "@/components/usage-chart";
import { isSignedIn, getUser, setUser, signOut } from "@/lib/auth";
import { getModels } from "@/lib/models";

const inputClass =
  "w-full rounded-none border border-[#33507C] bg-[#101E36] px-3 py-2 text-sm text-[#E9F1FB] outline-none focus:border-[#7CBDF2] focus:ring-1 focus:ring-[#7CBDF2]";
const label = "mb-1.5 block text-xs uppercase tracking-[0.06em] text-[#9FB2CC]";
const btnPrimary = "rounded-[10px] bg-[#FF8A1E] px-5 py-2.5 text-sm font-medium text-[#0A1322] transition-colors hover:bg-[#FF9F45]";
const btnGhost = "rounded-[10px] border border-[rgba(124,189,242,0.24)] px-5 py-2.5 text-sm text-[#E9F1FB] transition-colors hover:bg-[rgba(124,189,242,0.06)]";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-[#FF8A1E]" : "bg-[#243A57]"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
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

type Tab = "account" | "billing" | "payment" | "usage" | "preferences";
const TABS: Tab[] = ["account", "billing", "payment", "usage", "preferences"];

function ProfileInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("account");

  // Open the tab named in ?tab= (e.g. from the header avatar menu).
  useEffect(() => {
    const t = search.get("tab") as Tab | null;
    if (t && TABS.includes(t)) setTab(t);
  }, [search]);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [topupSaved, setTopupSaved] = useState(false);

  // billing (mock)
  const [autoTopup, setAutoTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(25);
  const [spendLimit, setSpendLimit] = useState(100);
  const [alertOn, setAlertOn] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState(25);

  // payment methods (mock)
  type Card = { id: number; brand: string; last4: string; exp: string; primary: boolean };
  const [cards, setCards] = useState<Card[]>([
    { id: 1, brand: "Visa", last4: "4242", exp: "08/28", primary: true },
  ]);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // preferences (mock)
  const [prefTheme, setPrefTheme] = useState("Dark");
  const [prefModelSlug, setPrefModelSlug] = useState(() => getModels()[0].slug);
  const [prefRes, setPrefRes] = useState("720p");
  const [autoplay, setAutoplay] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

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
      setAvatar(u.avatar);
    }
    setReady(true);
  }, [router]);

  function persist(next?: Partial<{ avatar: string | undefined }>) {
    setUser({
      name: name.trim() || "Creator",
      username: username.trim() || "creator",
      email,
      avatar: next && "avatar" in next ? next.avatar : avatar,
    });
  }

  function save() {
    persist();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatar(url);
      persist({ avatar: url });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  function brandFromNumber(num: string): string {
    const d = num.replace(/\D/g, "");
    if (d.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (d.startsWith("6")) return "Discover";
    return "Card";
  }
  function addCard() {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 4 || !cardExp.trim()) return;
    setCards((cs) => [
      ...cs,
      { id: Date.now(), brand: brandFromNumber(cardNumber), last4: digits.slice(-4), exp: cardExp.trim(), primary: cs.length === 0 },
    ]);
    setCardName(""); setCardNumber(""); setCardExp(""); setCardCvc("");
    setCardOpen(false);
  }
  function removeCard(id: number) {
    setCards((cs) => {
      const next = cs.filter((c) => c.id !== id);
      if (next.length && !next.some((c) => c.primary)) next[0].primary = true;
      return next;
    });
  }
  function makePrimary(id: number) {
    setCards((cs) => cs.map((c) => ({ ...c, primary: c.id === id })));
  }

  const history = mockHistory();
  const prefModels = getModels();
  const prefModel = prefModels.find((m) => m.slug === prefModelSlug) || prefModels[0];

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-8 py-10">
        {ready && (
          <>
            <div className="flex items-center gap-4">
              <label
                className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#FF8A1E]"
                title="Change photo"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-[#0A1322]">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] uppercase tracking-[0.08em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Edit
                </span>
                <input type="file" accept="image/*" onChange={pickAvatar} className="sr-only" />
              </label>
              <div>
                <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.01em]">{name}</h1>
                <p className="text-sm text-[#9FB2CC]">@{username} · {email}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start">
              {/* left sidebar nav */}
              <aside className="flex flex-row flex-wrap gap-1 border border-[#2E466B] p-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] lg:flex-col">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-left transition-colors ${
                      tab === t ? "bg-[rgba(255,138,30,0.12)] text-[#FF8A1E]" : "text-[#9FB2CC] hover:bg-[rgba(124,189,242,0.06)] hover:text-[#E9F1FB]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </aside>

              {/* content column */}
              <div className="min-w-0">

            {/* ACCOUNT */}
            {tab === "account" && (
              <div className="max-w-3xl space-y-8">
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
                  {saved && <span className="text-sm text-[#FF8A1E]">Saved ✓</span>}
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-[rgba(124,189,242,0.14)] pt-6">
                  <button onClick={out} className={btnGhost}>Sign out</button>
                  <button onClick={del} className="rounded-[10px] border border-[rgba(255,107,107,0.4)] px-5 py-2.5 text-sm text-[#FF6B6B] transition-colors hover:bg-[rgba(255,107,107,0.08)]">
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* BILLING - touching bento grid, unshaded (border-only), square */}
            {tab === "billing" && (
              <div className="grid grid-cols-4 border-b border-r border-[#2E466B]">
                {/* balance - large anchor tile */}
                <div className="col-span-4 row-span-2 flex flex-col justify-between border-l border-t border-[#2E466B] p-6 sm:col-span-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Current balance</p>
                    <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-5xl font-semibold text-[#FF8A1E]">$0.00</p>
                    <p className="mt-2 text-xs text-[#6E82A0]">Balance may lag recent usage by up to an hour.</p>
                  </div>
                  <div className="mt-5">
                    <button onClick={() => setAddOpen(true)} className={btnPrimary}>Add credits</button>
                  </div>
                </div>

                {/* expiring */}
                <div className="col-span-2 border-l border-t border-[#2E466B] p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Credits expiring in the next 30 days</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">$0.00</p>
                </div>

                {/* usage this month */}
                <div className="col-span-2 border-l border-t border-[#2E466B] p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Usage this month</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">$0.00</p>
                  <p className="mt-1 text-xs text-[#6E82A0]">$0.00 daily average</p>
                </div>

                {/* auto top-up */}
                <div className="col-span-4 border-l border-t border-[#2E466B] p-5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#E9F1FB]">Auto top-up</p>
                      <p className="text-xs text-[#6E82A0]">Buy credits when the balance runs low.</p>
                    </div>
                    <Toggle on={autoTopup} onClick={() => setAutoTopup((v) => !v)} />
                  </div>
                  {autoTopup && (
                    <>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className={label}>Top-up ($)</label>
                          <input type="number" min={5} value={topupAmount} onChange={(e) => setTopupAmount(Number(e.target.value))} className={inputClass} />
                        </div>
                        <div>
                          <label className={label}>Limit ($)</label>
                          <input type="number" min={0} value={spendLimit} onChange={(e) => setSpendLimit(Number(e.target.value))} className={inputClass} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => { setTopupSaved(true); setTimeout(() => setTopupSaved(false), 1600); }}
                          className={btnPrimary}
                        >
                          Confirm top-up
                        </button>
                        {topupSaved && <span className="text-sm text-[#FF8A1E]">Saved ✓</span>}
                      </div>
                    </>
                  )}
                </div>

                {/* low-balance alert */}
                <div className="col-span-4 border-l border-t border-[#2E466B] p-5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#E9F1FB]">Low-balance alert</p>
                      <p className="text-xs text-[#6E82A0]">Email me below a set threshold.</p>
                    </div>
                    <Toggle on={alertOn} onClick={() => setAlertOn((v) => !v)} />
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <div>
                      <label className={label}>Threshold ($)</label>
                      <input type="number" min={0} value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} className={`${inputClass} w-28`} disabled={!alertOn} />
                    </div>
                    <button onClick={() => setAlertOpen(true)} disabled={!alertOn} className={`${btnPrimary} disabled:opacity-40`}>
                      Set
                    </button>
                    {alertSaved && <span className="pb-2.5 text-sm text-[#FF8A1E]">Saved ✓</span>}
                  </div>
                </div>

                {/* footer strip */}
                <div className="col-span-4 border-l border-t border-[#2E466B] px-5 py-3 text-xs text-[#6E82A0]">
                  Billing period: Sep 1 to Sep 30, 2026
                </div>
              </div>
            )}

            {/* PAYMENT - saved methods (left) + billing address (right) */}
            {tab === "payment" && (
              <div className="grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">
                      Payment methods
                    </h2>
                    <button onClick={() => setCardOpen(true)} className={btnPrimary}>Add method</button>
                  </div>

                  {cards.length === 0 ? (
                    <p className="mt-4 border border-[#2E466B] p-5 text-sm text-[#6E82A0]">
                      No payment methods yet. Add one to buy credits.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-col border border-[#2E466B]">
                      {cards.map((c, i) => (
                        <div
                          key={c.id}
                          className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t border-[#2E466B]" : ""}`}
                        >
                          <span className="flex h-8 w-12 shrink-0 items-center justify-center border border-[#33507C] font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.04em] text-[#E9F1FB]">
                            {c.brand}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-[family-name:var(--font-jetbrains)] text-sm text-[#E9F1FB]">
                              •••• •••• •••• {c.last4}
                            </p>
                            <p className="text-xs text-[#6E82A0]">Expires {c.exp}</p>
                          </div>
                          {c.primary ? (
                            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.08em] text-[#FF8A1E]">
                              Default
                            </span>
                          ) : (
                            <button onClick={() => makePrimary(c.id)} className="text-xs text-[#7CBDF2] hover:text-[#F5C46B]">
                              Make default
                            </button>
                          )}
                          <button
                            onClick={() => removeCard(c.id)}
                            className="text-xs text-[#FF6B6B] hover:text-[#ff8f8f]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">
                    Billing address
                  </h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={label}>Address line</label>
                      <input className={inputClass} placeholder="123 Market St" />
                    </div>
                    <div>
                      <label className={label}>City</label>
                      <input className={inputClass} placeholder="San Francisco" />
                    </div>
                    <div>
                      <label className={label}>Postal code</label>
                      <input className={inputClass} placeholder="94103" />
                    </div>
                  </div>
                  <button className={`${btnPrimary} mt-5`}>Save address</button>
                </div>
              </div>
            )}

            {/* USAGE - extended asymmetric bento (graph + stats) | history right */}
            {tab === "usage" && (
              <div className="grid gap-8 lg:grid-cols-[2.1fr_0.9fr] lg:items-start">
                {/* left: daily usage graph + asymmetric stat tiles (unshaded) */}
                <div className="grid grid-cols-3 border-b border-r border-[#2E466B]">
                  <div className="col-span-3 border-l border-t border-[#2E466B] p-5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">Daily usage</p>
                      <p className="text-xs text-[#6E82A0]">Last 20 days</p>
                    </div>
                    <UsageChart className="mt-4" plotHeight={150} />
                  </div>
                  {[
                    ["Current invoice due", "$0.00", "", "col-span-2"],
                    ["Credit balance", "$0.00", "May lag usage", ""],
                    ["Subtotal (pre-discount)", "$0.00", "Selected period", ""],
                    ["Daily burn", "$0.00", "Avg over period", ""],
                    ["Model API usage", "$0.00", "This period", ""],
                  ].map(([t, v, s, span]) => (
                    <div key={t} className={`border-l border-t border-[#2E466B] p-5 ${span}`}>
                      <p className="whitespace-nowrap text-xs uppercase tracking-[0.06em] text-[#9FB2CC]">{t}</p>
                      <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{v}</p>
                      {s && <p className="mt-1 text-xs text-[#6E82A0]">{s}</p>}
                    </div>
                  ))}
                </div>

                {/* right: generation history, aligned to the right edge */}
                <div className="lg:justify-self-end lg:w-full">
                  <h2 className="text-right font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">
                    Generation history
                  </h2>
                  <div className="mt-4 flex flex-col border border-[#2E466B]">
                    {history.map((h, i) => (
                      <Link
                        key={h.id}
                        href={`/generate?model=${h.slug}`}
                        className={`flex items-center gap-3 p-3 transition-colors hover:bg-[#101E36] ${
                          i > 0 ? "border-t border-[#2E466B]" : ""
                        }`}
                      >
                        <img src={h.poster} alt="" className="h-11 w-[74px] shrink-0 bg-black object-cover" />
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

            {/* PREFERENCES (settings) */}
            {tab === "preferences" && (
              <div className="max-w-3xl space-y-8">
                <section>
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Appearance</h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={label}>Theme</label>
                      <select value={prefTheme} onChange={(e) => setPrefTheme(e.target.value)} className={inputClass}>
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

                <section className="border-t border-[rgba(124,189,242,0.14)] pt-6">
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Generation defaults</h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={label}>Default model</label>
                      <select value={prefModelSlug} onChange={(e) => setPrefModelSlug(e.target.value)} className={inputClass}>
                        {prefModels.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Default resolution</label>
                      <select value={prefRes} onChange={(e) => setPrefRes(e.target.value)} className={inputClass}>
                        {prefModel.resolutions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="border-t border-[rgba(124,189,242,0.14)] pt-6">
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-[#9FB2CC]">Notifications</h2>
                  <div className="mt-4 flex items-center justify-between gap-4 border border-[#2E466B] p-4">
                    <div>
                      <p className="text-sm text-[#E9F1FB]">Product email updates</p>
                      <p className="text-xs text-[#6E82A0]">Occasional news about new models and features.</p>
                    </div>
                    <Toggle on={emailUpdates} onClick={() => setEmailUpdates((v) => !v)} />
                  </div>
                </section>

                <div className="flex items-center gap-3">
                  <button onClick={() => { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 1600); }} className={btnPrimary}>
                    Save settings
                  </button>
                  {prefSaved && <span className="text-sm text-[#FF8A1E]">Saved ✓</span>}
                </div>
              </div>
            )}

              </div>
            </div>
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
            <p className="mt-1 text-xs text-[#6E82A0]">Pick a preset or enter an amount.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[10, 25, 50].map((a) => (
                <button
                  key={a}
                  onClick={() => setAddAmount(a)}
                  className={`rounded-[10px] border py-3 font-[family-name:var(--font-jetbrains)] text-sm transition-colors ${
                    addAmount === a
                      ? "border-[#FF8A1E] text-[#FF8A1E]"
                      : "border-[rgba(124,189,242,0.24)] hover:border-[#FF8A1E] hover:text-[#FF8A1E]"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className={label}>Enter amount ($)</label>
              <input
                type="number"
                min={1}
                value={addAmount}
                onChange={(e) => setAddAmount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <button onClick={() => setAddOpen(false)} className={`${btnPrimary} mt-5 w-full`}>
              Buy ${addAmount || 0} in credits
            </button>
          </div>
        </div>
      )}

      {/* Add payment method modal */}
      {cardOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6" onClick={() => setCardOpen(false)}>
          <div className="w-full max-w-sm rounded-[14px] border border-[#2E466B] bg-[#0B1524] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Add payment method</h3>
            <p className="mt-1 text-xs text-[#6E82A0]">Card details are not stored. Mock entry only.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={label}>Cardholder name</label>
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputClass} placeholder="Jane Creator" />
              </div>
              <div>
                <label className={label}>Card number</label>
                <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className={inputClass} placeholder="4242 4242 4242 4242" inputMode="numeric" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Expiry</label>
                  <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} className={inputClass} placeholder="MM/YY" />
                </div>
                <div>
                  <label className={label}>CVC</label>
                  <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} className={inputClass} placeholder="123" inputMode="numeric" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={addCard} className={`${btnPrimary} flex-1`}>Add card</button>
              <button onClick={() => setCardOpen(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Low-balance alert confirm modal */}
      {alertOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6" onClick={() => setAlertOpen(false)}>
          <div className="w-full max-w-sm rounded-[14px] border border-[#2E466B] bg-[#0B1524] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Confirm alert</h3>
            <p className="mt-1 text-xs text-[#6E82A0]">We&apos;ll email you when your balance drops below this amount.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#9FB2CC]">Threshold</dt>
                <dd className="font-[family-name:var(--font-jetbrains)] text-[#FF8A1E]">${alertThreshold}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#9FB2CC]">Email</dt>
                <dd className="truncate text-[#E9F1FB]">{email}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setAlertOpen(false); setAlertSaved(true); setTimeout(() => setAlertSaved(false), 1600); }}
                className={`${btnPrimary} flex-1`}
              >
                Confirm
              </button>
              <button onClick={() => setAlertOpen(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  );
}
