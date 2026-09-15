"use client";

// A number input that stays empty when you empty it.
//
// A plain <input type="number"> bound to a number turns a cleared box into 0,
// which reads as a real value: "$0.00 top-up", "0 second clip". This keeps the
// text the customer typed and reports null while the box is empty, so callers
// can refuse to submit rather than act on a zero nobody chose.
//
// No effect is needed to follow the value from outside (a preset button, say):
// while typing, the parsed text equals the value we just reported, so the text
// wins; when the value changes from elsewhere it no longer matches, and the new
// value wins.

import type { ComponentPropsWithoutRef } from "react";
import { useState } from "react";

type Props = Omit<ComponentPropsWithoutRef<"input">, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

export function NumberField({ value, onValueChange, ...rest }: Props) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const parsed = parse(text);
  const display = parsed === value ? text : value === null ? "" : String(value);

  return (
    <input
      type="number"
      inputMode="numeric"
      value={display}
      aria-invalid={display.trim() === "" ? true : undefined}
      onChange={(event) => {
        setText(event.target.value);
        onValueChange(parse(event.target.value));
      }}
      {...rest}
    />
  );
}

function parse(text: string): number | null {
  if (text.trim() === "") return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** True when a field holds something worth submitting. Zero never is. */
export function isPositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}
