/*
Pricing formulas from the model hub.

Adapted from new-api's web/src/features/pricing/lib/billing-expr.ts
(Copyright (C) 2023-2026 QuantumNous, GNU AGPL v3): the task-tier parser the hub's
admin UI uses to show and edit per-model prices. Prices are stored in the hub's
database as expressions like

  u("resolution") == "2K" ? tier("2K", u("seconds") * 0.13) : tier("768P", u("seconds") * 0.08)

This module parses that shape into tiers, so the site renders the same prices
the hub bills, and estimates a cost for given usage facts. Request-rule
multipliers are not supported here (the hub's pricing never uses them for video).
*/

export type BillingUsageFieldSchema = {
  type?: "number" | "boolean";
  unit?: "second" | "count" | "token" | "credit";
  enum?: string[];
  enumLabels?: Record<string, string | Record<string, string>>;
  description?: string | Record<string, string>;
};

export type BillingUsageSchema = Record<string, BillingUsageFieldSchema>;

export type TaskTierCondition = { field: string; value: string };

export type ParsedTaskTier = {
  label: string;
  conditions: TaskTierCondition[];
  constant: number;
  unitPrices: Record<string, number>;
};

const NUMERIC_LITERAL_REGEX = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

function stripExprVersion(exprStr: string): string {
  const m = (exprStr || "").match(/^v(\d+):([\s\S]*)$/);
  return m ? m[2] : exprStr || "";
}

function findTopLevelCharacter(expression: string, target: string, start = 0): number {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < expression.length; index += 1) {
    const character = expression[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      if (depth < 0) return -1;
      continue;
    }
    if (depth === 0 && character === target) return index;
  }
  return -1;
}

function findTernaryColon(expression: string, questionIndex: number): number {
  let depth = 0;
  let ternaryDepth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = questionIndex + 1; index < expression.length; index += 1) {
    const character = expression[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      if (depth < 0) return -1;
      continue;
    }
    if (depth !== 0) continue;
    if (character === "?") {
      ternaryDepth += 1;
      continue;
    }
    if (character !== ":") continue;
    if (ternaryDepth === 0) return index;
    ternaryDepth -= 1;
  }
  return -1;
}

function splitTopLevel(expression: string, operator: "&&" | "+"): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < expression.length; index += 1) {
    const character = expression[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') {
      quoted = true;
      continue;
    }
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      continue;
    }
    if (depth !== 0) continue;
    if (operator === "&&" && expression.slice(index, index + 2) === "&&") {
      parts.push(expression.slice(start, index).trim());
      start = index + 2;
      index += 1;
      continue;
    }
    if (operator === "+" && character === "+" && expression[index - 1] !== "e" && expression[index - 1] !== "E") {
      parts.push(expression.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(expression.slice(start).trim());
  return parts.filter(Boolean);
}

function parseConditions(expression: string, schema: BillingUsageSchema): TaskTierCondition[] | null {
  const conditions: TaskTierCondition[] = [];
  for (const part of splitTopLevel(expression, "&&")) {
    const match = part.match(/^u\(\s*("(?:[^"\\]|\\.)*")\s*\)\s*==\s*("(?:[^"\\]|\\.)*"|true|false)$/);
    if (!match) return null;
    let field: string;
    let value: string;
    try {
      field = JSON.parse(match[1]) as string;
      value = String(JSON.parse(match[2]));
    } catch {
      return null;
    }
    const definition = schema[field];
    if (definition?.type === "boolean") {
      if (!["true", "false"].includes(match[2])) return null;
    } else if (!definition?.enum?.includes(value) || !match[2].startsWith('"')) {
      return null;
    }
    conditions.push({ field, value });
  }
  return conditions.length > 0 ? conditions : null;
}

function parseTierCall(expression: string, conditions: TaskTierCondition[], schema: BillingUsageSchema): ParsedTaskTier | null {
  const trimmed = expression.trim();
  if (!trimmed.startsWith("tier(") || !trimmed.endsWith(")")) return null;
  const inner = trimmed.slice(5, -1);
  const commaIndex = findTopLevelCharacter(inner, ",");
  if (commaIndex < 0) return null;
  let label: string;
  try {
    label = JSON.parse(inner.slice(0, commaIndex).trim()) as string;
  } catch {
    return null;
  }
  if (typeof label !== "string") return null;

  const unitPrices: Record<string, number> = {};
  let constant = 0;
  let hasConstant = false;
  for (const term of splitTopLevel(inner.slice(commaIndex + 1), "+")) {
    if (NUMERIC_LITERAL_REGEX.test(term)) {
      const value = Number(term);
      if (hasConstant || !Number.isFinite(value) || value < 0) return null;
      constant = value;
      hasConstant = true;
      continue;
    }
    const scaled = term.match(/^u\(\s*("(?:[^"\\]|\\.)*")\s*\)\s*\*\s*(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*\/\s*1000000$/);
    const bare = term.match(/^u\(\s*("(?:[^"\\]|\\.)*")\s*\)\s*\*\s*(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/);
    const match = scaled ?? bare;
    if (!match) return null;
    let field: string;
    try {
      field = JSON.parse(match[1]) as string;
    } catch {
      return null;
    }
    const fieldSchema = schema[field];
    const value = Number(match[2]);
    if (fieldSchema?.type !== "number" || !fieldSchema.unit || field in unitPrices || !Number.isFinite(value) || value < 0) return null;
    if (fieldSchema.unit === "token" ? !scaled : Boolean(scaled)) return null;
    unitPrices[field] = fieldSchema.unit === "token" ? value / 1_000_000 : value;
  }
  if (Object.keys(unitPrices).length === 0) return null;
  return { label, conditions, constant, unitPrices };
}

/** Parses a hub pricing expression into ordered tiers; [] if it is not in tier form. */
export function parseTaskTiers(exprStr: string, schema: BillingUsageSchema | null | undefined): ParsedTaskTier[] {
  if (!exprStr || !schema || Object.keys(schema).length === 0) return [];
  try {
    const tiers: ParsedTaskTier[] = [];
    let remaining = stripExprVersion(exprStr).trim();
    while (remaining) {
      const questionIndex = findTopLevelCharacter(remaining, "?");
      if (questionIndex < 0) {
        const tier = parseTierCall(remaining, [], schema);
        if (!tier) return [];
        tiers.push(tier);
        break;
      }
      const colonIndex = findTernaryColon(remaining, questionIndex);
      if (colonIndex < 0) return [];
      const conditions = parseConditions(remaining.slice(0, questionIndex).trim(), schema);
      if (!conditions) return [];
      const tier = parseTierCall(remaining.slice(questionIndex + 1, colonIndex).trim(), conditions, schema);
      if (!tier) return [];
      tiers.push(tier);
      remaining = remaining.slice(colonIndex + 1).trim();
    }
    return tiers;
  } catch {
    return [];
  }
}

/** The tier the hub would bill for these usage facts (first whose conditions all match). */
export function matchTier(tiers: ParsedTaskTier[], facts: Record<string, string | number | boolean>): ParsedTaskTier | undefined {
  return tiers.find((tier) => tier.conditions.every((c) => String(facts[c.field]) === c.value));
}

/** Estimated cost in USD, or null when no tier applies. */
export function estimateCost(tiers: ParsedTaskTier[], facts: Record<string, string | number | boolean>): number | null {
  const tier = matchTier(tiers, facts);
  if (!tier) return null;
  let cost = tier.constant;
  for (const [field, price] of Object.entries(tier.unitPrices)) {
    const value = Number(facts[field] ?? 0);
    if (Number.isFinite(value)) cost += value * price;
  }
  return cost;
}

/** Per-second price for the tier matching `facts`, from its "seconds" unit price. */
export function perSecondPrice(tiers: ParsedTaskTier[], facts: Record<string, string | number | boolean>): number | null {
  const tier = matchTier(tiers, facts);
  return tier && typeof tier.unitPrices.seconds === "number" ? tier.unitPrices.seconds : null;
}
