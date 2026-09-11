"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlowBlobs } from "@/components/glow-blobs";
import { UsageChart } from "@/components/usage-chart";
import { AvatarEditor } from "@/components/avatar-editor";
import { isSignedIn, getUser, setUser, signOut } from "@/lib/auth";
import { getModels, getModel } from "@/lib/models";
import { getGenerations, formatWhen, type Generation } from "@/lib/generations";
import { getTheme, applyTheme, getSettings, saveSettings, type Theme } from "@/lib/prefs";
import { getCards, addCard as billAddCard, removeCard as billRemoveCard, saveCards } from "@/lib/billing";
import { EmptyState } from "@/components/empty-state";
import { Search } from "lucide-react";
import { useEscapeKey } from "@/lib/use-escape-key";
import { toast } from "@/lib/toast";

const inputClass =
  "w-full rounded-none border border-line-strong bg-raised px-3 py-2 text-sm text-fg outline-none focus:border-blue focus:ring-1 focus:ring-blue";
const label = "mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted";
const btnPrimary = "rounded-none bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-hover";
const btnGhost = "rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-track"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// Theme option icons: laptop (system), moon (dark), bright sun (light).
function ThemeIcon({ theme }: { theme: Theme }) {
  const p = { width: 15, height: 15, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, "aria-hidden": true } as const;
  if (theme === "system") {
    return (
      <svg {...p}>
        <rect x="2" y="3" width="12" height="8" rx="1" />
        <path d="M1 13.5h14" strokeLinecap="round" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg {...p}>
        <path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  // light, bright sun with rays
  return (
    <svg {...p}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M13 3l-1.1 1.1M4.1 11.9L3 13" strokeLinecap="round" />
    </svg>
  );
}

// Mock list of past generations. Intentionally long so the history panel

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
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

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
  // Payment methods live in lib/billing (persisted). Hydrated on mount below.
  const [cards, setCards] = useState<Card[]>([]);
  // Generation history (Usage tab). Source of truth: lib/generations.
  const [history, setHistory] = useState<Generation[]>([]);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // preferences (persisted via lib/prefs settings)
  const [prefModelSlug, setPrefModelSlug] = useState(() => getModels()[0].slug);
  const [prefRes, setPrefRes] = useState("720p");
  const [autoplay, setAutoplay] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");

  // Hydrate the theme + settings from storage.
  useEffect(() => {
    setThemeState(getTheme());
    const s = getSettings();
    setAutoplay(s.autoplay);
    setEmailUpdates(s.emailUpdates);
    if (s.defaultModel) setPrefModelSlug(s.defaultModel);
    if (s.defaultResolution) setPrefRes(s.defaultResolution);
  }, []);
  function chooseTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
  }
  function savePrefs() {
    saveSettings({ autoplay, emailUpdates, defaultModel: prefModelSlug, defaultResolution: prefRes });
    toast("Settings saved");
  }

  // Esc closes any open profile modal / the avatar editor.
  useEscapeKey(() => {
    setAddOpen(false);
    setCardOpen(false);
    setAlertOpen(false);
    setEditorSrc(null);
  });

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
    setCards(getCards());
    setHistory(getGenerations());
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
    toast("Changes saved");
  }

  // Open the picked image in the editor (crop/zoom/rotate/filter) before saving.
  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditorSrc(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function saveEditedAvatar(url: string) {
    setAvatar(url);
    persist({ avatar: url });
    setEditorSrc(null);
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
    setCards(billAddCard({ brand: brandFromNumber(cardNumber), last4: digits.slice(-4), exp: cardExp.trim() }));
    setCardName(""); setCardNumber(""); setCardExp(""); setCardCvc("");
    setCardOpen(false);
  }
  function removeCard(id: number) {
    setCards(billRemoveCard(id));
  }
  function makePrimary(id: number) {
    setCards((cs) => {
      const next = cs.map((c) => ({ ...c, primary: c.id === id }));
      saveCards(next);
      return next;
    });
  }

  // Generation-history search box (Usage tab). Filters by prompt or model name.
  const [historyQuery, setHistoryQuery] = useState("");
  const q = historyQuery.trim().toLowerCase();
  const filteredHistory = q
    ? history.filter((h) => `${h.prompt} ${getModel(h.slug)?.name ?? ""}`.toLowerCase().includes(q))
    : history;

  // Payment methods: always show the default card first.
  const sortedCards = [...cards].sort((a, b) => Number(b.primary) - Number(a.primary));

  const prefModels = getModels();
  const prefModel = prefModels.find((m) => m.slug === prefModelSlug) || prefModels[0];

  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />

      <main className="relative z-10 w-full flex-1 px-10 py-10">
        {ready && (
          <>
            <div className="flex items-center gap-4">
              <label
                className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full bg-accent"
                title="Change photo"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-[family-name:var(--font-jetbrains)] text-2xl font-semibold text-ink">
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
                <p className="text-sm text-muted">@{username} · {email}</p>
              </div>
            </div>

            <div className="settings-shell mt-8 grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start">
              {/* tab nav, layout varies per skin (see globals.css) */}
              <aside className="settings-nav flex flex-row flex-wrap gap-1 border border-line p-1 font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em] lg:flex-col">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-left transition-colors ${
                      tab === t ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-fg"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </aside>

              {/* content column */}
              <div className="settings-content min-w-0">

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
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-hairline pt-6">
                  <button onClick={out} className={btnGhost}>Sign out</button>
                  <button onClick={del} className="rounded-none border border-[rgba(255,107,107,0.4)] px-5 py-2.5 text-sm text-danger transition-colors hover:bg-[rgba(255,107,107,0.08)]">
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* BILLING - touching bento grid, unshaded (border-only), square */}
            {tab === "billing" && (
              <div className="grid grid-cols-4 border-b border-r border-line">
                {/* balance - large anchor tile */}
                <div className="col-span-4 row-span-2 flex flex-col justify-between border-l border-t border-line p-6 sm:col-span-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-muted">Current balance</p>
                    <p className="mt-3 font-[family-name:var(--font-jetbrains)] text-5xl font-semibold text-accent-ink">$0.00</p>
                    <p className="mt-2 text-xs text-dim">Balance may lag recent usage by up to an hour.</p>
                  </div>
                  <div className="mt-5">
                    <button onClick={() => setAddOpen(true)} className={btnPrimary}>Add credits</button>
                  </div>
                </div>

                {/* expiring */}
                <div className="col-span-2 border-l border-t border-line p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-muted">Credits expiring in the next 30 days</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">$0.00</p>
                </div>

                {/* usage this month */}
                <div className="col-span-2 border-l border-t border-line p-5">
                  <p className="text-xs uppercase tracking-[0.06em] text-muted">Usage this month</p>
                  <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">$0.00</p>
                  <p className="mt-1 text-xs text-dim">$0.00 daily average</p>
                </div>

                {/* auto top-up */}
                <div className="col-span-4 border-l border-t border-line p-5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-fg">Auto top-up</p>
                      <p className="text-xs text-dim">Buy credits when the balance runs low.</p>
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
                          onClick={() => toast("Auto top-up saved")}
                          className={btnPrimary}
                        >
                          Confirm top-up
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* low-balance alert */}
                <div className="col-span-4 border-l border-t border-line p-5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-fg">Low-balance alert</p>
                      <p className="text-xs text-dim">Email me below a set threshold.</p>
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
                  </div>
                </div>

                {/* footer strip */}
                <div className="col-span-4 border-l border-t border-line px-5 py-3 text-xs text-dim">
                  Billing period: Sep 1 to Sep 30, 2026
                </div>
              </div>
            )}

            {/* PAYMENT - saved methods (left) + billing address (right) */}
            {tab === "payment" && (
              <div className="grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">
                      Payment methods
                    </h2>
                    <button onClick={() => setCardOpen(true)} className={btnPrimary}>Add method</button>
                  </div>

                  {cards.length === 0 ? (
                    <p className="mt-4 border border-line p-5 text-sm text-dim">
                      No payment methods yet. Add one to buy credits.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-col border border-line">
                      {/* sortedCards puts the default method first. */}
                      {sortedCards.map((c, i) => (
                        <div
                          key={c.id}
                          className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t border-line" : ""}`}
                        >
                          <span className="flex h-8 w-12 shrink-0 items-center justify-center border border-line-strong font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.04em] text-fg">
                            {c.brand}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-[family-name:var(--font-jetbrains)] text-sm text-fg">
                              •••• •••• •••• {c.last4}
                            </p>
                            <p className="text-xs text-dim">Expires {c.exp}</p>
                          </div>
                          {c.primary ? (
                            <span className="font-[family-name:var(--font-jetbrains)] text-[10px] uppercase tracking-[0.08em] text-accent-ink">
                              Default
                            </span>
                          ) : (
                            <button onClick={() => makePrimary(c.id)} className="text-xs text-blue hover:text-gold-soft">
                              Make default
                            </button>
                          )}
                          <button
                            onClick={() => removeCard(c.id)}
                            className="text-xs text-danger hover:text-danger-hover"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">
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
                <div className="grid grid-cols-2 border-b border-r border-line sm:grid-cols-3">
                  <div className="col-span-2 border-l border-t border-line p-5 sm:col-span-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs uppercase tracking-[0.06em] text-muted">Daily usage</p>
                      <p className="text-xs text-dim">Last 20 days</p>
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
                    <div key={t} className={`min-w-0 border-l border-t border-line p-4 sm:p-5 ${span}`}>
                      <p className="text-xs uppercase leading-snug tracking-[0.06em] text-muted">{t}</p>
                      <p className="mt-2 font-[family-name:var(--font-jetbrains)] text-xl font-semibold sm:text-2xl">{v}</p>
                      {s && <p className="mt-1 text-xs text-dim">{s}</p>}
                    </div>
                  ))}
                </div>

                {/* right: generation history, aligned to the right edge.
                    Searchable (filters by prompt/model) and capped in height so
                    a long list scrolls instead of pushing the page down. */}
                <div className="lg:justify-self-end lg:w-full">
                  <h2 className="text-right font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">
                    Generation history
                  </h2>
                  {/* search box */}
                  <div className="mt-4">
                    <label htmlFor="history-search" className="sr-only">Search generation history</label>
                    <input
                      id="history-search"
                      type="search"
                      value={historyQuery}
                      onChange={(e) => setHistoryQuery(e.target.value)}
                      placeholder="Search history…"
                      className={inputClass}
                    />
                  </div>
                  {/* scrollable list (max height ≈ 5 rows, then scrolls) */}
                  <div className="mt-3 flex max-h-[22rem] flex-col overflow-y-auto border border-line">
                    {filteredHistory.length === 0 ? (
                      <EmptyState
                        icon={<Search size={22} />}
                        title={`No generations match “${historyQuery}”`}
                        hint="Try a different search."
                      />
                    ) : (
                      filteredHistory.map((h, i) => (
                        <Link
                          key={h.id}
                          href={`/generate?model=${h.slug}`}
                          className={`flex items-center gap-3 p-3 transition-colors hover:bg-raised ${
                            i > 0 ? "border-t border-line" : ""
                          }`}
                        >
                          <img src={h.poster} alt="" className="h-11 w-[74px] shrink-0 bg-black object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-fg">{h.prompt}</p>
                            <p className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.06em] text-gold">
                              {getModel(h.slug)?.name ?? h.slug} · {formatWhen(h.createdAt)}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES (settings), condensed to fit without scrolling */}
            {tab === "preferences" && (
              <div className="max-w-3xl space-y-5">
                <section>
                  <div>
                    <label className={label}>Theme</label>
                    <div className="inline-flex border border-line-strong font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.06em]">
                      {(["system", "dark", "light"] as Theme[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => chooseTheme(t)}
                          className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                            theme === t ? "bg-accent text-ink" : "text-muted hover:text-fg"
                          }`}
                        >
                          <ThemeIcon theme={t} />
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Toggle settings, 2-up grid */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-4 border border-line p-3">
                    <div>
                      <p className="text-sm text-fg">Autoplay previews</p>
                      <p className="text-xs text-dim">Play thumbnails on hover.</p>
                    </div>
                    <Toggle on={autoplay} onClick={() => setAutoplay((v) => !v)} />
                  </div>
                  <div className="flex items-center justify-between gap-4 border border-line p-3">
                    <div>
                      <p className="text-sm text-fg">Email updates</p>
                      <p className="text-xs text-dim">News about new models.</p>
                    </div>
                    <Toggle on={emailUpdates} onClick={() => setEmailUpdates((v) => !v)} />
                  </div>
                  <Link href="/docs" className="flex items-center justify-between gap-4 border border-line p-3 transition-colors hover:border-blue-line">
                    <div>
                      <p className="text-sm text-fg">Documentation</p>
                      <p className="text-xs text-dim">Guides, quickstart, API.</p>
                    </div>
                    <span className="font-[family-name:var(--font-jetbrains)] text-sm text-blue">Open →</span>
                  </Link>
                </div>

                <section className="border-t border-hairline pt-5">
                  <h2 className="font-[family-name:var(--font-jetbrains)] text-sm uppercase tracking-[0.08em] text-muted">Generation defaults</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
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

                <div className="flex items-center gap-3">
                  <button onClick={savePrefs} className={btnPrimary}>
                    Save settings
                  </button>
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
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Add credits</h3>
            <p className="mt-1 text-xs text-dim">Pick a preset or enter an amount.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[10, 25, 50].map((a) => (
                <button
                  key={a}
                  onClick={() => setAddAmount(a)}
                  className={`rounded-none border py-3 font-[family-name:var(--font-jetbrains)] text-sm transition-colors ${
                    addAmount === a
                      ? "border-accent text-accent-ink"
                      : "border-hairline-strong hover:border-accent hover:text-accent-ink"
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
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Add payment method</h3>
            <p className="mt-1 text-xs text-dim">Card details are not stored. Mock entry only.</p>
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
          <div className="w-full max-w-sm rounded-[14px] border border-line bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">Confirm alert</h3>
            <p className="mt-1 text-xs text-dim">We&apos;ll email you when your balance drops below this amount.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Threshold</dt>
                <dd className="font-[family-name:var(--font-jetbrains)] text-accent-ink">${alertThreshold}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="truncate text-fg">{email}</dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setAlertOpen(false); toast("Low-balance alert set"); }}
                className={`${btnPrimary} flex-1`}
              >
                Confirm
              </button>
              <button onClick={() => setAlertOpen(false)} className={btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar editor (crop / zoom / rotate / filter) */}
      {editorSrc && (
        <AvatarEditor src={editorSrc} onCancel={() => setEditorSrc(null)} onSave={saveEditedAvatar} />
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
