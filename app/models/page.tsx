import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModelCard } from "@/components/model-card";
import { getModels } from "@/lib/models";

export const metadata = { title: "Models — Fluxion AI Video" };

export default function ModelsPage() {
  const models = getModels();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <span className="font-[family-name:var(--font-jetbrains)] text-xs uppercase tracking-[0.1em] text-[#7CBDF2]">
          — Models
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-sora)] text-4xl font-medium uppercase tracking-[0.01em]">
          Model catalog
        </h1>
        <p className="mt-3 max-w-xl text-[#A9BBD4]">
          Compare models by capability, duration, and resolution. Hover a card to preview.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <ModelCard key={m.slug} model={m} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
