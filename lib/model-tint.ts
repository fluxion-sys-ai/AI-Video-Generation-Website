/**
 * The colour that belongs to a model.
 *
 * Cards used to take their tint from their position in whatever list they
 * happened to be in - `PASTELS[i % PASTELS.length]` - so MiniMax H3 was yellow
 * in one sort, grey in another, and something else again on the pricing page.
 * A colour that moves teaches nothing; a colour that sticks becomes the way
 * people recognise a model at a glance.
 *
 * So the tint comes from the slug. Same model, same colour, everywhere it is
 * drawn, and a model added tomorrow gets its own without renumbering anything.
 */

/** The model palette: soft enough for black text at any of them. */
export const MODEL_TINTS = ["#fff2c2", "#d9ecff", "#ffd9ec", "#d9f5e6", "#e9ddff", "#ffe3d1"] as const;

/** A stable index for a slug. FNV-1a, which is plenty for six buckets. */
function hash(slug: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    value ^= slug.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/** The model's own colour. */
export function modelTint(slug: string): string {
  if (!slug) return MODEL_TINTS[0];
  return MODEL_TINTS[hash(slug) % MODEL_TINTS.length];
}

/**
 * Whether this model takes the big tile in a mosaic.
 *
 * Also the model's own property rather than its position, for the same reason:
 * a card that is large in one ordering and small in the next reads as a
 * different thing. The catalogue's own order decides, so an operator who wants
 * a model featured can say so by moving it.
 */
export function modelFeatured(sortOrder: number): boolean {
  return sortOrder % 5 === 0;
}
