import { Suspense } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AuthForm } from "@/components/auth/auth-form";
import { PlansDots } from "@/components/decor/plans-dots";
import { GlowBlobs } from "@/components/decor/glow-blobs";

export const metadata = { title: "Log in" };

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
