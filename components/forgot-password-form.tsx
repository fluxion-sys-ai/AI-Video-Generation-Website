"use client";

import Link from "next/link";
import { useState } from "react";
import { BACKEND_ENABLED, requestPasswordReset } from "@/lib/api";

const inputClass = "w-full rounded-[10px] border border-hairline-strong bg-panel px-3 py-2.5 text-sm outline-none focus:border-blue";
const buttonClass =
  "w-full rounded-[10px] bg-accent px-4 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col px-6 py-20">
      <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.02em]">Reset password</h1>
      {!BACKEND_ENABLED ? (
        <p className="mt-6 text-sm text-fg-soft-2">Password reset is available when the site runs with its backend.</p>
      ) : sent ? (
        <div className="mt-6 space-y-4 text-sm text-fg-soft-2">
          <p>If an account uses {email}, we sent it a link to choose a new password. The link expires in 10 minutes.</p>
          <p>
            <Link href="/login" className="text-blue hover:underline">Back to log in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-sm text-fg-soft-2">Email</label>
            <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "Sending…" : "Email me a reset link"}
          </button>
          <p className="text-sm text-fg-soft-2">
            Remembered it? <Link href="/login" className="text-blue hover:underline">Log in</Link>
          </p>
        </form>
      )}
    </main>
  );
}
