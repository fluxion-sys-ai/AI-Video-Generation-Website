import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelCard } from "@/components/model-card";
import { PlansDots } from "@/components/plans-dots";
import { GlowBlobs } from "@/components/glow-blobs";
import { getModels } from "@/lib/models";

export const metadata = { title: "Models · Fluxion AI Video" };

export default function ModelsPage() {
  const models = getModels();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-8 py-16">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.14em] text-[#E0A24E]">
          Models
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-jetbrains)] text-4xl font-medium uppercase tracking-[0.01em]">
          Model catalog
        </h1>
        <span className="mt-3 block h-px w-10 bg-[#E0A24E]" />
        <p className="mt-4 max-w-xl text-[#9FB2CC]">
          Compare models by capability, duration, and resolution. Hover a card to preview.
        </p>
        <div className="relative mt-10 py-12">
          <GlowBlobs variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
          <PlansDots variant="b" className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {models.map((m) => (
              <ModelCard key={m.slug} model={m} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
