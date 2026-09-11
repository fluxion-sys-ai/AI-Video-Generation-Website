"use client";

/* ============================================================================
   Onboarding slideshow (sign-up flow)
   ----------------------------------------------------------------------------
   A multi-step "slideshow" wizard shown on /signup. The flow:

     0. Account       , email + password (or Continue with Google)
     1. Your name     , name (pre-filled from the email), email shown read-only
     2. Who are you    , pick a persona (student, developer, …) [optional]
     3. Payment method , card + billing address                 [optional / skip]
     4. Add credits    , preset or custom top-up                 [optional / skip]

   Everything is mocked (frontend-only, see lib/auth.ts). On finish we sign the
   user in, save their profile, stash the extra answers in localStorage, and
   send them into the dashboard.

   Each slide re-mounts on step change (via React `key`) so the `animate-slide-in`
   CSS replays, giving the slideshow feel. Colors/shapes come from the design
   tokens in app/globals.css, no hardcoded hex here.
   ============================================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, setUser } from "@/lib/auth";
import { addCard, addCredits, saveCards } from "@/lib/billing";

// ---- shared class strings (kept token-driven) -------------------------------
const inputClass =
  "w-full rounded-[10px] border border-hairline-strong bg-panel px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-blue";
const labelClass = "mb-1.5 block text-xs uppercase tracking-[0.06em] text-muted";
const btnPrimary =
  "rounded-none bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent-hover disabled:opacity-40";
const btnGhost =
  "rounded-none border border-hairline-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-hover";

// Persona choices for the "Who are you?" step.
const PERSONAS = [
  { key: "student", label: "Student", desc: "Learning & side projects" },
  { key: "developer", label: "Developer", desc: "Building with the API" },
  { key: "creator", label: "Creator", desc: "Content & social" },
  { key: "designer", label: "Designer", desc: "Motion & visuals" },
  { key: "business", label: "Business", desc: "Marketing & product" },
  { key: "researcher", label: "Researcher", desc: "Experiments & study" },
];

const CREDIT_PRESETS = [10, 25, 50, 100];

// Turn an email into a friendly display name ("jane.doe@x" → "Jane Doe").
function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "").replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}
function usernameFromEmail(email: string): string {
  return (email.split("@")[0] || "creator").replace(/[^a-z0-9]/gi, "").toLowerCase() || "creator";
}

// The ordered slides. `optional` steps show a "Skip" control.
const STEPS = [
  { key: "account", title: "Create your account", optional: false },
  { key: "name", title: "What should we call you?", optional: false },
  { key: "persona", title: "Who are you?", optional: true },
  { key: "payment", title: "Add a payment method", optional: true },
  { key: "credits", title: "Add credits to get started", optional: true },
] as const;

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Collected answers across the slides.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [persona, setPersona] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [addr, setAddr] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [credits, setCredits] = useState(25);
  const [finishing, setFinishing] = useState(false);

  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;
  // Slide 0 (account) needs an email before you can continue.
  const canAdvance = step === 0 ? /\S+@\S+\.\S+/.test(email) : true;

  function goNext() {
    // When leaving the account slide, seed the display name from the email.
    if (step === 0 && !name) setName(nameFromEmail(email));
    if (isLast) return finish();
    setStep((s) => Math.min(s + 1, total - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  // Complete sign-up: create the mock account, persist profile + extra answers.
  function finish() {
    setFinishing(true);
    const finalEmail = email || "you@fluxion.ai";
    signIn(finalEmail);
    setUser({
      name: name.trim() || nameFromEmail(finalEmail) || "Creator",
      username: usernameFromEmail(finalEmail),
      email: finalEmail,
    });
    try {
      if (persona) localStorage.setItem("fluxion.persona", persona);
      // Save the entered card (or record that none was added) via lib/billing,
      // then apply any starting credits. This is what gates generation later.
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length >= 12) {
        addCard({ brand: "Card", last4: digits.slice(-4), exp: cardExp.trim() || "-" });
      } else {
        saveCards([]); // user skipped payment, start with no method
      }
      if (credits > 0) addCredits(credits);
    } catch {
      /* localStorage may be unavailable; non-critical for the mock. */
    }
    router.push("/dashboard");
  }

  // Jump straight in with Google, mock: no real OAuth, just advance the flow.
  function withGoogle() {
    if (!email) setEmail("you@gmail.com");
    if (!name) setName("You");
    setStep(1);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-16">
      {/* progress: "Step X of N" + dot rail */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.12em] text-gold">
            Step {step + 1} of {total}
          </span>
          <span className="text-xs text-dim">{current.title}</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-accent" : "bg-track"
              }`}
            />
          ))}
        </div>
      </div>

      {/* the animated slide (keyed on step so the animation replays) */}
      <div key={step} className="animate-slide-in flex-1">
        <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl font-medium uppercase tracking-[0.02em] sm:text-3xl">
          {current.title}
        </h1>

        {/* ---- Slide 0: account ------------------------------------------- */}
        {current.key === "account" && (
          <div className="mt-8 space-y-4">
            <button type="button" onClick={withGoogle} className={`${btnGhost} flex w-full items-center justify-center gap-3 bg-panel py-3`}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </button>
            <div className="my-2 flex items-center gap-3 text-xs text-dim">
              <span className="h-px flex-1 bg-hairline" /> or <span className="h-px flex-1 bg-hairline" />
            </div>
            <div>
              <label htmlFor="ob-email" className={labelClass}>Email</label>
              <input id="ob-email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="ob-password" className={labelClass}>Password</label>
              <input id="ob-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Create a password" />
            </div>
          </div>
        )}

        {/* ---- Slide 1: name (email autofilled) --------------------------- */}
        {current.key === "name" && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-muted">This is how you&apos;ll appear across Fluxion.</p>
            <div>
              <label htmlFor="ob-name" className={labelClass}>Full name</label>
              <input id="ob-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jane Creator" />
            </div>
            <div>
              <label htmlFor="ob-email-2" className={labelClass}>Email (from sign-up)</label>
              {/* autofilled + read-only: it came from the account step */}
              <input id="ob-email-2" value={email} readOnly className={`${inputClass} cursor-not-allowed text-muted`} />
            </div>
          </div>
        )}

        {/* ---- Slide 2: persona ------------------------------------------- */}
        {current.key === "persona" && (
          <div className="mt-8">
            <p className="text-sm text-muted">Helps us tailor examples and defaults. Pick one, or skip.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PERSONAS.map((p) => {
                const on = persona === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPersona(on ? null : p.key)}
                    className={`rounded-none border p-4 text-left transition-colors ${
                      on ? "border-accent bg-accent-soft" : "border-line hover:bg-hover"
                    }`}
                  >
                    <span className={`block font-[family-name:var(--font-jetbrains)] text-sm ${on ? "text-accent-ink" : "text-fg"}`}>
                      {p.label}
                    </span>
                    <span className="mt-1 block text-xs text-dim">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Slide 3: payment + billing address ------------------------- */}
        {current.key === "payment" && (
          <div className="mt-8 space-y-6">
            <p className="text-sm text-muted">Optional. Add a card now or later from Settings.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="ob-card" className={labelClass}>Card number</label>
                <input id="ob-card" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className={inputClass} placeholder="4242 4242 4242 4242" inputMode="numeric" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label htmlFor="ob-exp" className={labelClass}>Expiry</label>
                  <input id="ob-exp" value={cardExp} onChange={(e) => setCardExp(e.target.value)} className={inputClass} placeholder="MM/YY" />
                </div>
                <div className="col-span-1">
                  <label htmlFor="ob-cvc" className={labelClass}>CVC</label>
                  <input id="ob-cvc" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} className={inputClass} placeholder="123" inputMode="numeric" />
                </div>
                <div className="col-span-1">
                  <label htmlFor="ob-cardname" className={labelClass}>Name</label>
                  <input id="ob-cardname" value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputClass} placeholder="Jane" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.08em] text-muted">Billing address</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="ob-addr" className={labelClass}>Address</label>
                  <input id="ob-addr" value={addr} onChange={(e) => setAddr(e.target.value)} className={inputClass} placeholder="123 Market St" />
                </div>
                <div>
                  <label htmlFor="ob-city" className={labelClass}>City</label>
                  <input id="ob-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="San Francisco" />
                </div>
                <div>
                  <label htmlFor="ob-postal" className={labelClass}>Postal code</label>
                  <input id="ob-postal" value={postal} onChange={(e) => setPostal(e.target.value)} className={inputClass} placeholder="94103" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- Slide 4: add credits --------------------------------------- */}
        {current.key === "credits" && (
          <div className="mt-8 space-y-5">
            <p className="text-sm text-muted">Optional. Credits are pay as you go, so you can top up any time.</p>
            <div className="grid grid-cols-4 gap-2">
              {CREDIT_PRESETS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setCredits(a)}
                  className={`rounded-none border py-3 font-[family-name:var(--font-jetbrains)] text-sm transition-colors ${
                    credits === a ? "border-accent text-accent-ink" : "border-hairline-strong hover:border-accent hover:text-accent-ink"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="ob-credits" className={labelClass}>Custom amount ($)</label>
              <input id="ob-credits" type="number" min={0} value={credits} onChange={(e) => setCredits(Number(e.target.value))} className={inputClass} />
            </div>
          </div>
        )}
      </div>

      {/* footer nav: Back · Skip (optional) · Next/Finish */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <button type="button" onClick={goBack} disabled={step === 0} className={`${btnGhost} disabled:opacity-30`}>
          Back
        </button>
        <div className="flex items-center gap-3">
          {current.optional && !isLast && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="text-sm text-muted transition-colors hover:text-fg">
              Skip
            </button>
          )}
          <button type="button" onClick={goNext} disabled={!canAdvance || finishing} className={btnPrimary}>
            {isLast ? (finishing ? "Setting up…" : "Finish & enter Fluxion") : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
