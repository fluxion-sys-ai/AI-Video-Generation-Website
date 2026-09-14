"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completePasswordReset } from "@/lib/auth";
import { toast } from "@/lib/toast";

const inputClass = "w-full rounded-[10px] border border-hairline-strong bg-panel px-3 py-2.5 text-sm outline-none focus:border-blue";
const buttonClass =
  "w-full rounded-[10px] bg-accent px-4 py-2.5 font-medium text-ink transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

// Target of the link in the password reset email: /user/reset?email=&token=
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await completePasswordReset(email, token, password);
      toast("Password updated. You are signed in.");
      router.push("/generate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link is invalid or has expired.");
      setBusy(false);
    }
  }

  if (!email || !token) {
    return (
      <main className="mx-auto flex max-w-sm flex-col px-6 py-20">
        <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.02em]">Reset password</h1>
        <p className="mt-6 text-sm text-fg-soft-2">
          This reset link is incomplete. <Link href="/forgot" className="text-blue hover:underline">Request a new one</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col px-6 py-20">
      <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.02em]">Choose a new password</h1>
      <p className="mt-2 text-sm text-fg-soft-2">For {email}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm text-fg-soft-2">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm text-fg-soft-2">Confirm password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error} <Link href="/forgot" className="text-blue hover:underline">Request a new link</Link>.
          </p>
        )}
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
