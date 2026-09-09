"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Settings now lives inside the profile hub (Preferences section, left sidebar).
export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile?tab=preferences");
  }, [router]);
  return <div className="min-h-screen" />;
}
