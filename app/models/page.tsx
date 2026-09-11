import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelCatalog } from "@/components/model-catalog";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { getModels } from "@/lib/models";

export const metadata = { title: "Models" };

export default function ModelsPage() {
  const models = getModels();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-10 py-16">
        <GlowBlobs variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
        <PlansDots variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
        <ModelCatalog models={models} />
      </main>
      <SiteFooter />
    </div>
  );
}
