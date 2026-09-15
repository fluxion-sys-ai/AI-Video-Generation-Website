"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn, getUser } from "@/lib/auth";
import { refreshCatalog } from "@/lib/models";
import { BACKEND_ENABLED, getBillingSummary, quotaToUsd, getSelf } from "@/lib/hub";
import { useLive } from "@/lib/live";
import { getGenerations, refreshGenerations } from "@/lib/generations";
import { getCredits, refreshBilling } from "@/lib/billing";
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
      .then((me) => setBalanceUsd(quotaToUsd(me.quota)))
      .catch(() => {});
    getBillingSummary(30)
      .then((s) => setSpendUsd(s.period.spend_usd))
      .catch(() => {});
  }, [billingVersion, generationsVersion]);

  const snapshot = BACKEND_ENABLED
    ? { balanceUsd, generations: getGenerations().length, spendUsd }
    : { balanceUsd: getCredits(), generations: getGenerations().length, spendUsd: null };

  if (!ready) return <div className="min-h-screen" />;

  const data = { name, favs, recents, snapshot };
  if (skin === "editorial") return <DashboardEditorial {...data} />;
  if (skin === "luxury") return <DashboardLuxury {...data} />;
  if (skin === "playful") return <DashboardPlayful {...data} />;
  if (skin === "cosmos") return <DashboardCosmos {...data} />;
  return <DashboardOG {...data} />;
}
