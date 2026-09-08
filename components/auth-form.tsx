"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/generate";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    signIn(); // mock — no real auth
    router.push(next);
  }

  const title = mode === "login" ? "Log in" : "Create account";

  return (
    <main className="mx-auto flex max-w-sm flex-col px-6 py-20">
      <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl font-medium uppercase tracking-[0.02em]">{title}</h1>
      <p className="mt-2 text-sm text-[#A9BBD4]">
        {next !== "/generate"
          ? "Sign in to continue. Your form is saved."
          : "Any details work."}
      </p>

      <button
        type="button"
        onClick={() => { signIn(); router.push(next); }}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-[10px] border border-[rgba(124,189,242,0.24)] bg-[#0E1730] px-4 py-2.5 text-sm font-medium text-[#E9F1FB] transition-colors hover:bg-[rgba(124,189,242,0.06)]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-[#6E82A0]">
        <span className="h-px flex-1 bg-[rgba(124,189,242,0.14)]" />
        or
        <span className="h-px flex-1 bg-[rgba(124,189,242,0.14)]" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-[#A9BBD4]">Email</label>
          <input
            id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] border border-[rgba(124,189,242,0.2)] bg-[#0E1730] px-3 py-2.5 text-sm outline-none focus:border-[#7CBDF2]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-[#A9BBD4]">Password</label>
          <input
            id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[10px] border border-[rgba(124,189,242,0.2)] bg-[#0E1730] px-3 py-2.5 text-sm outline-none focus:border-[#7CBDF2]"
          />
        </div>
        <button type="submit" className="w-full rounded-[10px] bg-[#7CBDF2] px-4 py-2.5 font-medium text-[#0A1322] transition-colors hover:bg-[#A6D4F8]">
          {title}
        </button>
      </form>
      <p className="mt-6 text-sm text-[#A9BBD4]">
        {mode === "login" ? (
          <>No account? <Link href="/signup" className="text-[#7CBDF2] hover:underline">Sign up</Link></>
        ) : (
          <>Have an account? <Link href="/login" className="text-[#7CBDF2] hover:underline">Log in</Link></>
        )}
      </p>
    </main>
  );
}
