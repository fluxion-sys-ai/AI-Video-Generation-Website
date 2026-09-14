"use client";

/**
 * lib/billing.ts, payment methods, credit balance, and the "can this user
 * generate?" entitlement check. This is the ONE place the app tracks billing.
 *
 * With a backend (NEXT_PUBLIC_BACKEND=1) the balance is the customer's real credit
 * in the hub and top-ups go through Stripe Checkout; the entitlement check becomes
 * "has credit" instead of "has a card on file". Saved cards stay Stripe-side, so
 * the card functions are demo-only (see cardsSupported()).
 * Without a backend everything here is a localStorage mock.
 */

import { BACKEND_ENABLED, getSelf, quotaToUsd, startTopupCheckout } from "./hub";
import { notify } from "./live";

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
  if (BACKEND_ENABLED || typeof window === "undefined") return [];
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

// MOCK: persist the card list. Real impl: not needed, the server owns this.
export function saveCards(cards: Card[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
    localStorage.setItem(LEGACY_HASCARD_KEY, cards.length ? "1" : "0");
  } catch {
    /* quota / unavailable, non-critical for the mock */
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
 * the client, never trust this check alone for billing.
 */
export function hasPaymentMethod(): boolean {
  // Backend mode: the customer may generate while they hold credit. The hub also
  // enforces this server-side, which is what actually protects billing.
  if (BACKEND_ENABLED) return !balanceLoaded || balanceUsd > 0;
  return getCards().length > 0;
}

let balanceUsd = 0;
let balanceLoaded = false;

/** Loads the real balance from the hub. */
export async function refreshBilling(): Promise<void> {
  if (!BACKEND_ENABLED) return;
  const me = await getSelf();
  balanceUsd = quotaToUsd(me.quota);
  balanceLoaded = true;
  notify("billing");
}

/** Credit balance in dollars. Backend mode serves the cache refreshBilling() fills. */
export function getCredits(): number {
  if (BACKEND_ENABLED) return Math.round(balanceUsd * 100) / 100;
  return Number(readJSON<string | number>(CREDITS_KEY, 0)) || 0;
}

/** False in backend mode: cards live in Stripe, so the site does not manage them. */
export function cardsSupported(): boolean {
  return !BACKEND_ENABLED;
}

/** Sends the customer to Stripe Checkout for `amount` dollars of credit. */
export async function startTopup(amount: number): Promise<void> {
  window.location.href = await startTopupCheckout(Math.max(1, Math.round(amount)));
}

// Demo-only. In backend mode credit arrives when Stripe confirms the payment, so
// this just re-reads the balance.
export function addCredits(amount: number): number {
  if (BACKEND_ENABLED) {
    void refreshBilling().catch(() => {});
    return getCredits();
  }
  const next = getCredits() + amount;
  if (typeof window !== "undefined") localStorage.setItem(CREDITS_KEY, String(next));
  return next;
}
