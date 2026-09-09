import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";
import { PlansDots } from "@/components/plans-dots";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <PlansDots variant="a" className="h-full w-full" />
      </div>
      <SiteHeader />
      <div className="flex-1">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  );
}
