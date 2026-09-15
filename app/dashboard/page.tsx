"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn, getUser, reconcileUser } from "@/lib/auth";
import { refreshCatalog } from "@/lib/models";
import { BACKEND_ENABLED, getBillingSummary, getOnboarding, getTopupInfo, quotaToUsd, getSelf } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { getGenerations, refreshGenerations } from "@/lib/generations";
import { getCards, getCredits, refreshBilling } from "@/lib/billing";
import { getFavorites, getRecents } from "@/lib/prefs";
import { useSkin } from "@/lib/use-skin";
import { DashboardOG, DashboardEditorial, DashboardLuxury, DashboardPlayful, DashboardCosmos } from "@/components/skins/dashboards";

export default function DashboardPage() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const billingVersion = useLive("billing", BACKEND_ENABLED ? refreshBilling : undefined);
  const generationsVersion = useLive("generations", BACKEND_ENABLED ? refreshGenerations : undefined);
  // The month's spend is the one figure the balance alone cannot give.
  const [spendUsd, setSpendUsd] = useState<number | null>(null);
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const router = useRouter();
  const skin = useSkin();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  // Whether paying is possible at all. Null until the hub answers, so the
  // getting-started card neither invites a customer into a checkout that
  // cannot complete nor calls the feature "coming soon" once it has arrived.
  const [paymentsOpen, setPaymentsOpen] = useState<boolean | null>(null);
  // Getting-started milestones, latched by the backend so they belong to the
  // account rather than to this browser. Null until it answers.
  const [progress, setProgress] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login?next=/dashboard");
      return;
    }
    setName(getUser()?.name || "Creator");
    setFavs(getFavorites());
    setRecents(getRecents());
    setReady(true);
  }, [router]);

  // The balance and the month's spend, straight from the hub. Both stay null
  // until they answer, so the tiles show "—" rather than a made-up zero.
  useEffect(() => {
    if (!BACKEND_ENABLED || !isSignedIn()) return;
    getSelf()
      .then((me) => {
        setBalanceUsd(quotaToUsd(me.quota));
        // This call already has the account, so the greeting can be the name
        // the account carries rather than whatever this browser remembers.
        setName(reconcileUser(me).name);
      })
      .catch(() => {});
    getBillingSummary(30)
      .then((s) => setSpendUsd(s.period.spend_usd))
      .catch(() => {});
    getTopupInfo()
      .then((info) => setPaymentsOpen(Boolean(info.enable_stripe_topup)))
      .catch(() => {});
    getOnboarding()
      .then((p) => setProgress(Object.fromEntries(p.steps.map((s) => [s.key, s.reached]))))
      .catch(() => {});
  }, [billingVersion, generationsVersion]);

  const snapshot = BACKEND_ENABLED
    ? { balanceUsd, generations: getGenerations().length, spendUsd }
    : { balanceUsd: getCredits(), generations: getGenerations().length, spendUsd: null };

  if (!ready) return <div className="min-h-screen" />;

  // Without a backend the Payment tab is a working mock, so billing is "open",
  // there is nowhere to hold an API key, and progress is whatever this browser
  // has done.
  const demoProgress = { account: true, billing: getCards().length > 0, balance: getCredits() > 0 };
  const data = {
    name,
    favs,
    recents,
    snapshot,
    paymentsOpen: BACKEND_ENABLED ? paymentsOpen : true,
    progress: BACKEND_ENABLED ? progress : demoProgress,
    apiKeysAvailable: BACKEND_ENABLED,
  };
  if (skin === "editorial") return <DashboardEditorial {...data} />;
  if (skin === "luxury") return <DashboardLuxury {...data} />;
  if (skin === "playful") return <DashboardPlayful {...data} />;
  if (skin === "cosmos") return <DashboardCosmos {...data} />;
  return <DashboardOG {...data} />;
}
