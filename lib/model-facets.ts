/**
 * What a model can be filtered by.
 *
 * The catalogue's tag chips used to be the union of *capability labels* -
 * marketing text an operator writes - and a model matched a tag only if one of
 * its own labels was exactly that string. Two things went wrong with that.
 * Filtering by "768P" hid MiniMax H3, which sells 768P but describes itself as
 * "Up to 2K". And picking two tags matched models with *either*, so narrowing a
 * search widened the results.
 *
 * So a facet is anything true about the model: the labels it carries and the
 * resolutions it actually sells. Matching is case-insensitive, because the
 * catalogue contains both "768P" and "720p".
 */

import type { Model } from "./models";

/**
 * A label that says nothing but a resolution: "768P", "1080p", "2K", and the
 * "Up to 2K" form an operator writes in a capability list.
 *
 * "Up to 4K" was the original bug wearing a different hat. As a label it
 * matched only the one model that happened to type it, while the "4k" chip
 * beside it matched every model that sells 4k - two chips for one question,
 * answering it differently depending on which was pressed.
 */
const BARE_RESOLUTION = /^(?:up to\s+)?(?:\d{3,4}p|\d+k)$/i;

/**
 * A pixel size, e.g. "2048x1152". What an image model sells instead of named
 * resolutions - and not a category.
 *
 * A named resolution is a small closed set that several models share, so
 * "720p" is a genuine filter. A pixel size is a point on a continuum: two
 * image models put thirteen of them in the chip row, each one selecting
 * exactly one model, which is a link to that model dressed up as a filter.
 * They stay searchable and stay on the model's own page; they are just not
 * chips.
 */
const PIXEL_SIZE = /^\d{3,5}\s*[x\u00d7]\s*\d{3,5}$/i;

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/** Everything this model can be matched on, normalised. */
export function modelFacets(model: Model): Set<string> {
  const facets = new Set<string>();
  for (const label of model.capabilities || []) facets.add(normalise(label));
  for (const resolution of model.resolutions || []) facets.add(normalise(resolution));
  return facets;
}

/**
 * The chips to offer, in the order models are listed.
 *
 * A label that is only a resolution name is left out: the resolutions each
 * model sells are already chips, and offering "768P" twice - once as a label
 * somebody typed, once as a fact - filters differently depending on which one
 * is pressed, which is the bug this file exists to remove.
 *
 * Pass one kind of model at a time. The chips for video and the chips for
 * images have almost nothing in common - "Camera control" and "Sound" mean
 * nothing to a picture, "Any ratio from 1:16 to 16:1" means nothing to a clip -
 * so a single row of both was 39 chips, most of which narrowed the list to
 * something the reader was not looking at.
 */
export function modelTags(models: Model[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  const add = (value: string) => {
    const key = normalise(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    tags.push(value.trim());
  };
  for (const model of models) {
    for (const label of model.capabilities || []) {
      if (!BARE_RESOLUTION.test(label.trim())) add(label);
    }
  }
  for (const model of models) {
    for (const resolution of model.resolutions || []) {
      if (!PIXEL_SIZE.test(resolution.trim())) add(resolution);
    }
  }
  return tags;
}

/**
 * Does this model satisfy every selected tag?
 *
 * Every, not some: each chip narrows the list. Nothing matching them all is an
 * honest empty result, not a reason to fall back to a looser rule.
 */
export function matchesAllTags(model: Model, tags: Iterable<string>): boolean {
  const facets = modelFacets(model);
  for (const tag of tags) {
    if (!facets.has(normalise(tag))) return false;
  }
  return true;
}

/** The text a free-text search should look through. */
export function modelSearchText(model: Model): string {
  return [model.name, model.tagline, model.description, ...(model.capabilities || []), ...(model.resolutions || [])]
    .join(" ")
    .toLowerCase();
}
