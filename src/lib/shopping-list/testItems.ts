import type { ShoppingAisle } from "@/lib/shopping-list/aisle";
import { formatQuantity } from "@/lib/shopping-list/amount";
import type { ShoppingItemSource, ShoppingListItem } from "@/lib/shopping-list/item";
import type { RecipeIngredient } from "@/types/ingredient.types";

/** A list item for tests, shaped like the native suite's fixture helper. */
export function makeItem(
  id: string,
  name: string,
  aisle: ShoppingAisle,
  options: {
    slug?: string;
    onList?: boolean;
    bought?: number;
    boughtAt?: number;
    order?: number;
    amount?: [number, string | null];
    display?: string;
    sources?: ShoppingItemSource[];
  } = {}
): ShoppingListItem {
  const order = options.order ?? 0;
  return {
    id,
    name,
    quantityValue: options.amount?.[0] ?? null,
    quantityDisplay:
      options.display ?? (options.amount ? formatQuantity(options.amount[0], "en") : null),
    unit: options.amount?.[1] ?? null,
    ingredientSlug: options.slug ?? null,
    aisle,
    onList: options.onList ?? true,
    addedAt: 1_000 + order,
    boughtAt: options.boughtAt ?? null,
    boughtCount: options.bought ?? 0,
    sources: options.sources ?? [],
    createdAt: order,
  };
}

export function source(
  kind: ShoppingItemSource["kind"],
  value: number | null,
  unit: string | null = null,
  recipe: { id: string; name: string; at?: number } | null = null
): ShoppingItemSource {
  return {
    kind,
    addedAt: recipe?.at ?? null,
    addedBy: null,
    quantityValue: value,
    quantityDisplay: null,
    unit,
    recipeId: recipe?.id ?? null,
    recipeName: recipe?.name ?? null,
  };
}

/** A recipe ingredient row for tests, the native suite's `RecipeIngredient.mock`. */
export function makeIngredient(
  id: string,
  value: number | null,
  unit: string | null,
  name: string,
  options: { slug?: string; order?: number; display?: string | null; scalable?: boolean } = {}
): RecipeIngredient {
  return {
    id,
    recipeId: "recipe",
    rawText: name,
    quantity: {
      value,
      display:
        options.display !== undefined
          ? options.display
          : value === null
            ? null
            : formatQuantity(value, "en"),
    },
    unit,
    unitNormalized: null,
    name,
    nameNormalized: null,
    preparationNote: null,
    isOptional: false,
    groupName: null,
    sortOrder: options.order ?? 0,
    isScalable: options.scalable ?? true,
    ingredientSlug: options.slug ?? null,
  };
}

/** A line that doesn't scale and has no amount ("a pinch of sea salt"). */
export const PINCH = makeIngredient("i5", null, null, "a pinch of sea salt", {
  order: 4,
  scalable: false,
});
