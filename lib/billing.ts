"use client";

/**
 * lib/billing.ts — payment methods, credit balance, and the "can this user
 * generate?" entitlement check. This is the ONE place the app tracks billing.
 *
 * BACKEND DEVS: everything here is a frontend-only mock backed by localStorage.
 * Replace each function body with a real API call (see BACKEND.md). Keep the
 * function names + return shapes — the UI (generate/profile/onboarding) only
 * ever talks to billing through these.
 */

const CARDS_KEY = "fluxion.cards";
const CREDITS_KEY = "fluxion.credits";
const LEGACY_HASCARD_KEY = "fluxion.hasCard"; // written by older onboarding builds

export type Card = { id: number; brand: string; last4: string; exp: string; primary: boolean };

// Every fresh demo account starts with one sample card so the demo "just works".
// Delete it in Profile → Payment to see the generation gate kick in.
const SEED_CARDS: Card[] = [{ id: 1, brand: "Visa", last4: "4242", exp: "08/28", primary: true }];

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// MOCK: list saved payment methods. Real impl: GET /api/billing/cards.
export function getCards(): Card[] {
  if (typeof window === "undefined") return [];
  // Seed the sample card once, only for brand-new accounts (key never set).
  if (localStorage.getItem(CARDS_KEY) === null) {
    // Respect the legacy onboarding flag: if the user explicitly skipped adding
    // a card, start with none instead of seeding one.
    const seed = localStorage.getItem(LEGACY_HASCARD_KEY) === "0" ? [] : SEED_CARDS;
    saveCards(seed);
    return seed;
  }
  return readJSON<Card[]>(CARDS_KEY, []);
}

// MOCK: persist the card list. Real impl: not needed — the server owns this.
export function saveCards(cards: Card[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    localStorage.setItem(LEGACY_HASCARD_KEY, cards.length ? "1" : "0");
  } catch {
    /* quota / unavailable — non-critical for the mock */
  }
}

// MOCK: add a card. Real impl: POST /api/billing/cards (tokenized by Stripe/etc).
export function addCard(card: Omit<Card, "id" | "primary">): Card[] {
  const cards = getCards();
  const next: Card = { ...card, id: Date.now(), primary: cards.length === 0 };
  const list = [...cards, next];
  saveCards(list);
  return list;
}

// MOCK: remove a card, re-promoting a default if the primary was removed.
export function removeCard(id: number): Card[] {
  const remaining = getCards().filter((c) => c.id !== id);
  if (remaining.length && !remaining.some((c) => c.primary)) remaining[0].primary = true;
  saveCards(remaining);
  return remaining;
}

/**
 * The entitlement gate. Generation is only allowed when the user has a payment
 * method on file. Real impl: derive from the server (subscription/credits), not
 * the client — never trust this check alone for billing.
 */
export function hasPaymentMethod(): boolean {
  return getCards().length > 0;
}

// MOCK: current credit balance. Real impl: GET /api/billing/credits.
export function getCredits(): number {
  return Number(readJSON<string | number>(CREDITS_KEY, 0)) || 0;
}

// MOCK: add credits (after a top-up). Real impl: server updates after payment.
export function addCredits(amount: number): number {
  const next = getCredits() + amount;
  if (typeof window !== "undefined") localStorage.setItem(CREDITS_KEY, String(next));
  return next;
}
