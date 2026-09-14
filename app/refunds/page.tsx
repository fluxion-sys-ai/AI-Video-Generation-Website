import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GlowBlobs } from "@/components/decor/glow-blobs";
import { LegalDocument } from "@/components/site/legal-document";

export const metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-10 py-16">
        <GlowBlobs variant="c" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
        <LegalDocument slug="refunds" title="Refund Policy" />
      </main>
      <SiteFooter />
    </div>
  );
}
