"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn, getUser } from "@/lib/auth";
import { getModels } from "@/lib/models";
import { getFavorites, getRecents } from "@/lib/prefs";
import { useSkin } from "@/lib/use-skin";
import { DashboardOG, DashboardEditorial, DashboardLuxury } from "@/components/dashboards";

export default function DashboardPage() {
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

  if (!ready) return <div className="min-h-screen" />;

  const data = { name, favs, recents, models: getModels() };
  if (skin === "editorial") return <DashboardEditorial {...data} />;
  if (skin === "luxury") return <DashboardLuxury {...data} />;
  return <DashboardOG {...data} />;
}
