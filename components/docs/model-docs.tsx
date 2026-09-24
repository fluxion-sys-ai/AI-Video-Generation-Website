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
import { money, ratesFor, rateRange, tokenBilled, useRateCard } from "@/lib/rate-card";
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
      {/* break-words because a label can be an identifier with no space in
          it to break at, and a fixed column then paints it over the value. */}
      <span className="w-40 shrink-0 break-words font-[family-name:var(--font-jetbrains)] text-[11px] uppercase tracking-[0.06em] text-dim">{label}</span>
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

/** The same, for a model that makes a picture: one call, no polling. */
function imageCurlFor(model: Model, perImage: string): string {
  const size = model.popularResolutions[0] || model.resolutions[0];
  const input = model.reference?.image;
  return [
    `# ${model.name} — ${perImage} per image`,
    `curl -X POST https://api.fluxion-sys.ai/v1/images/generations \\`,
    `  -H "Authorization: Bearer $FLUXION_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{`,
    `    "model": "${model.hubModel || model.slug}",`,
    `    "prompt": "A cut-glass decanter on dark walnut, late afternoon light",`,
    `    "size": "${size}"${input ? "," : ""}`,
    ...(input ? [`    "image": ["$REFERENCE_0A7304DE"]   # optional: work from a picture`] : []),
    `  }'`,
    ``,
    `# The picture is in the response - there is no job to poll:`,
    `#   {"created": 1789368841, "data": [{"url": "https://…"}]}`,
  ].join("\n");
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
      `      "reference_video": ["https://…"]${model.supports.timeBudget ? "," : ""}`,
    );
    // A ceiling on generation time, where the model offers one. Shown in the
    // example because a parameter nobody sees is a parameter nobody uses.
    if (model.supports.timeBudget) lines.push(`      "generation_time_budget_s": 4.5`);
    lines.push(`    }`);
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
        const isImage = model.modality === "image";
        const perSecond = rateRange(ratesFor(card, model), model.resolutions) ?? money(model.usdPerSecond);
        // An image is one price whatever its size, and it comes from the model
        // rather than from an expression over what was asked for.
        const perImage = money(model.usdPerImage ?? 0);
        const input = model.reference?.image;
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
              {isImage ? (
                <>
                  <Row label="route">
                    <code className="text-gold-2">POST /v1/images/generations</code>
                  </Row>
                  <Row label="size">
                    {model.resolutions.join(", ")}
                    {model.imageSize?.max_pixels
                      ? `, or any width x height up to ${(model.imageSize.max_pixels / 1e6).toFixed(1)} megapixels`
                      : ""}
                  </Row>
                  {input && (
                    <Row label="image">
                      up to {input.max_count ?? 10} to work from, as{" "}
                      <code className="text-gold-2">image</code>
                      {input.usd_each
                        ? `; the first ${input.free_count ?? 0} free, then ${money(input.usd_each)} each`
                        : ""}
                    </Row>
                  )}
                  <Row label="price">{perImage} per image</Row>
                </>
              ) : (
                <>
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
                  {model.supports.timeBudget && (
                    <Row label="time budget">
                      optional:{" "}
                      <code className="text-gold-2">metadata.generation_time_budget_s</code>, a ceiling in
                      seconds on generation time. The clip is
                      planned to fit it — a tighter budget works from less of your reference detail and comes
                      back sooner, at the same length and size. A budget that cannot be met is refused, and
                      the refusal names the smallest one that can. Same price either way.
                    </Row>
                  )}
                  <Row label="price">
                    {perSecond} per second of output
                    {tokenBilled(ratesFor(card, model)) && (
                      <span className="block text-dim">
                        Indicative. This model is billed on the tokens the provider counts for the finished clip,
                        reference material included, so the charge depends on what you send as well as what you ask
                        for.
                      </span>
                    )}
                  </Row>
                </>
              )}
            </div>
            <Code>{isImage ? imageCurlFor(model, perImage) : curlFor(model, perSecond)}</Code>
          </div>
        );
      })}
    </div>
  );
}
