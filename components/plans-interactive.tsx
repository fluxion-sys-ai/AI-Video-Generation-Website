"use client";

import Link from "next/link";
import { useState } from "react";

export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  priceNum: number;
  credits: string;
  creditsNum: number;
  features: string[];
  cta: string;
  popular: boolean;
};

function Bar({
  label,
  display,
  pct,
  active,
  onEnter,
  onLeave,
}: {
  label: string;
  display: string;
  pct: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="cursor-default">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={active ? "text-[#FFB020]" : "text-[#C7D4E6]"}>{label}</span>
        <span className={`font-[family-name:var(--font-jetbrains)] ${active ? "text-[#FFD98A]" : "text-[#FFB020]"}`}>
          {display}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#101E36]">
        <div
          className={`h-full rounded-full transition-all ${active ? "bg-[#FFB020] shadow-[0_0_14px_2px_rgba(255,176,32,0.65)]" : "bg-[#FF8A1E]"}`}
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function PlansInteractive({ plans }: { plans: Plan[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const on = (id: string) => () => setHovered(id);
  const off = () => setHovered(null);

  const maxCredits = Math.max(...plans.map((p) => p.creditsNum));
  const cpd = (p: Plan) => (p.priceNum > 0 ? Math.round(p.creditsNum / p.priceNum) : 0);
  const maxCpd = Math.max(...plans.map(cpd));

  return (
    <div>
      {/* Plan cards — accent on hover; Pro just gets a star */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((p) => {
          const active = hovered === p.id;
          return (
            <div
              key={p.id}
              id={p.id}
              onMouseEnter={on(p.id)}
              onMouseLeave={off}
              className={`scroll-mt-24 rounded-[12px] border p-4 transition-colors ${
                active ? "border-[#FF8A1E] bg-[rgba(255,138,30,0.08)]" : "border-[#2E466B] bg-[#0B1524]"
              }`}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-[family-name:var(--font-jetbrains)] text-lg font-medium uppercase tracking-[0.02em]">
                  {p.name}
                </h2>
                {p.popular && (
                  <span title="Most popular" className="text-[#FFB020]" aria-label="Most popular">
                    ★
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-jetbrains)] text-2xl font-semibold">{p.price}</span>
                <span className="text-xs text-[#6E82A0]">{p.period}</span>
              </div>
              <p className="text-xs text-[#9FB2CC]">{p.credits}</p>
              <ul className="mt-3 space-y-1 text-xs text-[#A9BBD4]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#E0A24E]">•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-4 block rounded-[10px] px-4 py-2 text-center text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#FF8A1E] text-[#0A1322] hover:bg-[#FF9F45]"
                    : "border border-[rgba(124,189,242,0.24)] text-[#E9F1FB] hover:bg-[rgba(124,189,242,0.06)]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Plan value charts — the hovered plan's bar glows (hover a card or a bar) */}
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#E0A24E]">
            Monthly credits by plan
          </h3>
          <div className="mt-4 space-y-3">
            {plans.map((p) => (
              <Bar
                key={p.id}
                label={p.name}
                display={p.creditsNum.toLocaleString()}
                pct={(p.creditsNum / maxCredits) * 100}
                active={hovered === p.id}
                onEnter={on(p.id)}
                onLeave={off}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#E0A24E]">
            Credits per $ (value)
          </h3>
          <div className="mt-4 space-y-3">
            {plans.map((p) => (
              <Bar
                key={p.id}
                label={p.name}
                display={p.priceNum > 0 ? `${cpd(p)} / $` : "Free"}
                pct={p.priceNum > 0 ? (cpd(p) / maxCpd) * 100 : 0}
                active={hovered === p.id}
                onEnter={on(p.id)}
                onLeave={off}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-[#6E82A0]">More credits per dollar = better value. Studio stretches each dollar furthest.</p>
        </div>
      </div>
    </div>
  );
}
