import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
