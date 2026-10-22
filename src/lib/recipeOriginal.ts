import type { Json } from "@/types/database.types";

/**
 * The part of an original's snapshot the matching rule reads. The extractor's
 * full shape (`OriginalSnapshotSchema` in recipe-extractor
 * `src/originals/snapshot.ts`) also has description, instructions and
 * servingsUnit, which the rule deliberately ignores.
 */
export type OriginalSnapshot = {
  title: string;
  ingredientItems: string[];
  servings: number | null;
};

/** An imported recipe's immutable extraction result (`recipe_originals`), in the source language plus cached translations. */
export type RecipeOriginal = {
  id: string;
  snapshot: OriginalSnapshot;
  translations: OriginalSnapshot[];
};

export type SavedRecipeForMatch = {
  name: string;
  /** `recipe_ingredients.raw_text` in sort order, verbatim. */
  ingredientLines: string[];
  baseServings: number;
};

function parseSnapshot(value: Json | undefined): OriginalSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { title, ingredients, servings } = value;
  if (typeof title !== "string" || !Array.isArray(ingredients)) return null;
  const ingredientItems: string[] = [];
  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient !== "object" || Array.isArray(ingredient)) return null;
    if (typeof ingredient.item !== "string") return null;
    ingredientItems.push(ingredient.item);
  }
  return { title, ingredientItems, servings: typeof servings === "number" ? servings : null };
}

/** Parses a `recipe_originals` row; `null` when its source snapshot is not the extractor's shape. A malformed translation is skipped. */
export function parseRecipeOriginal(row: {
  id: string;
  snapshot: Json;
  translations: Json;
}): RecipeOriginal | null {
  const snapshot = parseSnapshot(row.snapshot);
  if (!snapshot) return null;
  const translations =
    row.translations && typeof row.translations === "object" && !Array.isArray(row.translations)
      ? Object.values(row.translations)
          .map(parseSnapshot)
          .filter((translation): translation is OriginalSnapshot => translation !== null)
      : [];
  return { id: row.id, snapshot, translations };
}

/**
 * `true` while the saved recipe still is its original, in the source language
 * or any cached translation (an import is written in the importer's language).
 * The import writes `title` as the name, each `item` verbatim as `raw_text` and
 * `servings ?? 1` as `base_servings` (recipe-extractor `src/imports/writeBack.ts`),
 * so an untouched recipe reproduces exactly these three. Same rule as iOS
 * `RecipeOriginal.matches`.
 */
export function matchesOriginal(original: RecipeOriginal, recipe: SavedRecipeForMatch): boolean {
  return [original.snapshot, ...original.translations].some(
    (snapshot) =>
      snapshot.title === recipe.name &&
      snapshot.ingredientItems.length === recipe.ingredientLines.length &&
      snapshot.ingredientItems.every((item, index) => item === recipe.ingredientLines[index]) &&
      Math.round(snapshot.servings ?? 1) === recipe.baseServings
  );
}
