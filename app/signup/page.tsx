import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Onboarding } from "@/components/auth/onboarding";
import { PlansDots } from "@/components/decor/plans-dots";
import { GlowBlobs } from "@/components/decor/glow-blobs";

export const metadata = { title: "Create account" };

// Sign-up is a guided, multi-step "slideshow" (components/onboarding.tsx):
// account → name → who-are-you → payment → credits.
export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GlowBlobs variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <PlansDots variant="a" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <SiteHeader />
      <div className="relative z-10 flex flex-1 flex-col">
        <Onboarding />
      </div>
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
