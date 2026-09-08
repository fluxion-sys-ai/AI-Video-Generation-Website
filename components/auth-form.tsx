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
      <h1 className="font-[family-name:var(--font-sora)] text-3xl font-medium tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 text-sm text-[#A9BBD4]">
        {next !== "/generate"
          ? "Sign in to continue — your form is saved."
          : "Frontend demo — any details work."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
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
