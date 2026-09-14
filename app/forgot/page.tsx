import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";

export const metadata = { title: "Reset password" };

export default function Page() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="d" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <div className="relative z-10 flex-1">
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
