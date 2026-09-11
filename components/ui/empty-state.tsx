"use client";

import Link from "next/link";
import type { ReactNode } from "react";

// A friendly "nothing here yet" placeholder: a small icon in a circle, a line
// of text, an optional hint, and an optional call-to-action (link or button).
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  const actionClass =
    "mt-1 inline-flex items-center rounded-none border border-accent-border bg-accent-soft px-4 py-2 font-[family-name:var(--font-jetbrains)] text-xs font-medium uppercase tracking-[0.06em] text-accent-ink transition-colors hover:bg-hover";
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-14 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong bg-raised text-dim">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-fg-soft">{title}</p>
        {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
      </div>
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClass}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClass}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
