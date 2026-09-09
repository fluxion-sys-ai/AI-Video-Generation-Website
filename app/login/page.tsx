import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <div className="relative z-10 flex-1">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
