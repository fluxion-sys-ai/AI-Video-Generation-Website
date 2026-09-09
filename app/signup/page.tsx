import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";
import { PlansDots } from "@/components/plans-dots";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PlansDots variant="a" className="pointer-events-none absolute inset-0 h-full w-full" />
      <SiteHeader />
      <div className="relative z-10 flex-1">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
