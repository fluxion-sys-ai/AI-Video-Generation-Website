"use client";

// The per-model half of the documentation, built from the catalogue rather than
// written out.
//
// Two reasons it is not prose. The first is that a model's own row already
// carries what a customer needs - the lengths it runs, the resolutions and
// shapes it sells, what reference material it takes and how much of it, what a
// second costs - so hand-written docs are a copy that goes stale the day an
// operator edits the row. The second is who is reading: an unpublished model
// reaches only the accounts let in on it (scripts/preview_access.py in the
// backend), and /catalog already answers that question per session. So this
// documents exactly the models the person reading can actually use, and marks
// the ones nobody else can see.

import { useLive } from "@/lib/live";
import { getModels, refreshCatalog, type Model } from "@/lib/models";
import { BACKEND_ENABLED } from "@/lib/hub";
import { money, ratesFor, rateRange, useRateCard } from "@/lib/rate-card";
import { PreviewBadge } from "@/components/models/preview-badge";
import { CopyButton } from "@/components/docs/copy-button";

function Code({ children }: { children: string }) {
  return (
    <div className="relative mt-3">
      <CopyButton text={children} />
      <pre className="overflow-x-auto border border-line-strong bg-surface p-4 pr-12 font-[family-name:var(--font-jetbrains)] text-sm leading-relaxed text-fg">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-hairline py-2 last:border-0">
      <span className="w-40 shrink-0 font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-dim">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-muted">{children}</span>
    </div>
  );
}

/** "4-30" for a run of consecutive seconds, "5, 10, 15" for a list of them. */
function durationRange(durations: number[]): string {
  if (durations.length === 0) return "—";
  const sorted = [...durations].sort((a, b) => a - b);
  const consecutive = sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
  return consecutive && sorted.length > 3 ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(", ");
}

function referenceSummary(model: Model): string[] {
  const rules = model.reference;
  if (!rules) return [];
  const parts: string[] = [];
  if (rules.image) parts.push(`${rules.image.max_count ?? 1} image${(rules.image.max_count ?? 1) === 1 ? "" : "s"}`);
  if (rules.video) parts.push(`${rules.video.max_count ?? 1} clip${(rules.video.max_count ?? 1) === 1 ? "" : "s"}`);
  if (rules.audio) parts.push(`${rules.audio.max_count ?? 1} audio track${(rules.audio.max_count ?? 1) === 1 ? "" : "s"}`);
  return parts;
}

function curlFor(model: Model, perSecond: string): string {
  const seconds = Math.min(...model.durations);
  const resolution = model.popularResolutions[0] || model.resolutions[0];
  const ratio = model.aspectRatios[0] || "16:9";
  const references = referenceSummary(model).length > 0;
  const lines = [
    `# ${model.name} — ${perSecond} per second of output`,
    `curl -X POST https://api.fluxion-sys.ai/v1/videos \\`,
    `  -H "Authorization: Bearer $FLUXION_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "model": "${model.hubModel || model.slug}",`,
    `    "prompt": "A red paper boat drifts down a rain-soaked city gutter at dusk",`,
    `    "seconds": ${seconds},`,
    `    "resolution": "${resolution}",`,
    `    "aspect_ratio": "${ratio}"${model.supports.audio ? "," : ""}`,
  ];
  if (model.supports.audio) lines.push(`    "audio": true`);
  if (references) {
    lines[lines.length - 1] += ",";
    lines.push(
      `    "metadata": {`,
      `      "reference_image": ["https://…"],`,
      `      "reference_video": ["https://…"]`,
      `    }`,
    );
  }
  lines.push(`  }'`);
  return lines.join("\n");
}

export function ModelDocs() {
  useLive("models", BACKEND_ENABLED ? refreshCatalog : undefined);
  const { card } = useRateCard();
  const models = getModels();

  if (models.length === 0) {
    return <p className="text-muted">Loading the model list…</p>;
  }

  return (
    <div className="space-y-10">
      {models.map((model) => {
        const perSecond = rateRange(ratesFor(card, model), model.resolutions) ?? money(model.usdPerSecond);
        const references = referenceSummary(model);
        return (
          <div key={model.slug} id={`model-${model.slug}`} className="scroll-mt-28 space-y-3">
            <h3 className="flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-base font-medium uppercase tracking-[0.02em] text-fg-strong">
              {model.name}
              {model.preview && <PreviewBadge />}
            </h3>
            {model.preview && (
              <p className="text-sm text-muted">
                Not released yet. Your account has early access, so this model is visible to you and not to
                everyone else; what it costs and what it accepts may still change.
              </p>
            )}
            <p className="text-muted">{model.description || model.tagline}</p>
            <div className="mt-2">
              <Row label="model">
                <code className="text-gold-2">{model.hubModel || model.slug}</code>
              </Row>
              <Row label="seconds">{durationRange(model.durations)}</Row>
              <Row label="resolution">{model.resolutions.join(", ")}</Row>
              <Row label="aspect_ratio">{model.aspectRatios.join(", ")}</Row>
              <Row label="sound">
                {model.supports.audio ? "on by default; send audio: false for a silent clip" : "always on"}
              </Row>
              {references.length > 0 && (
                <Row label="reference material">
                  up to {references.join(", ")} in one request, as{" "}
                  <code className="text-gold-2">metadata.reference_image</code>,{" "}
                  <code className="text-gold-2">reference_video</code> and{" "}
                  <code className="text-gold-2">reference_audio</code>
                  {Number(model.reference?.min_visual || 0) > 0 ? "; at least one image or clip is required" : ""}
                </Row>
              )}
              <Row label="price">{perSecond} per second of output</Row>
            </div>
            <Code>{curlFor(model, perSecond)}</Code>
          </div>
        );
      })}
    </div>
  );
}
