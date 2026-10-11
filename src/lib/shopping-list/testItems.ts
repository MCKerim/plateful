import type { ShoppingAisle } from "@/lib/shopping-list/aisle";
import { formatQuantity } from "@/lib/shopping-list/amount";
import type { ShoppingItemSource, ShoppingListItem } from "@/lib/shopping-list/item";

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
