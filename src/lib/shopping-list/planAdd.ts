import type { RecipeIngredient } from "@/types/ingredient.types";
import type { Amount } from "@/lib/shopping-list/item";

/**
 * A scaled amount at shopping precision, the server's
 * `private.shopping_round_scaled`: whole from 10 up, one decimal from 1 up,
 * else two (583.33 g is 583 g, 1.666 tsp 1.7 tsp). Rounded half away from
 * zero on the value's shortest spelling, the way the server's `numeric` goes
 * (0.285 is 0.29, not the binary 0.28499… rounded down).
 */
export function roundScaled(value: number): number {
  const magnitude = Math.abs(value);
  const places = magnitude >= 10 ? 0 : magnitude >= 1 ? 1 : 2;
  const shifted = Math.round(Number(`${magnitude}e${places}`));
  const rounded = Number(`${shifted}e-${places}`);
  if (Number.isNaN(rounded)) return value;
  return Math.sign(value) * rounded;
}

/** The ingredient's name as the list takes it; the raw line when the parser split none out. */
export function displayName(ingredient: RecipeIngredient): string {
  return ingredient.name?.trim() || ingredient.rawText.trim();
}

/**
 * The amount the list gets for this row at `scale`, the way
 * `add_ingredients_to_shopping_list` works it out: unscaled, the row as
 * written; else a scalable value multiplied and rounded to shopping precision
 * with the written display dropped (a range "2-3" lands as its midpoint, "5"
 * at twice), a line without a value keeping its text. The unit trimmed, none
 * when empty.
 */
export function listAmount(ingredient: RecipeIngredient, scale: number): Amount {
  const unit = ingredient.unit?.trim() || null;
  const { value, display } = ingredient.quantity;
  if (scale === 1) return { quantityValue: value, quantityDisplay: display, unit };
  return {
    quantityValue: ingredient.isScalable && value !== null ? roundScaled(value * scale) : value,
    quantityDisplay: value === null ? display : null,
    unit,
  };
}

/** A serving count changes anything only with a declared base and a row that scales. */
export function canScale(base: number | null, ingredients: RecipeIngredient[]): boolean {
  return (base ?? 0) > 0 && ingredients.some((ingredient) => ingredient.isScalable);
}

/** The factor `servings` puts on rows written for `base` servings; 1 when nothing can scale. */
export function servingsScale(
  servings: number,
  base: number | null,
  ingredients: RecipeIngredient[]
): number {
  if (base === null || !canScale(base, ingredients)) return 1;
  return Math.max(servings, 1) / base;
}
