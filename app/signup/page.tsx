import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
