"use client";

import { getModels } from "@/lib/models";
import { ModelCard } from "@/components/model-card";

// One horizontal line, auto-scrolling. Hover pauses; hovering a card plays it.
export function ModelMarquee() {
  const models = getModels();
  const row = [...models, ...models]; // duplicated for a seamless loop

  return (
    <div className="marquee-pause relative overflow-hidden">
      <div className="flex w-max animate-marquee gap-8">
        {row.map((m, i) => (
          <div key={`${m.slug}-${i}`} className="w-[340px] shrink-0">
            <ModelCard model={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
