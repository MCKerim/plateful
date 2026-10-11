import type {
  IngredientsBundle,
  RecipeIngredient,
  RecipeIngredientRow,
} from "@/types/ingredient.types";

/**
 * Transform a database row to domain type
 */
export function transformIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    rawText: row.raw_text,
    quantity: {
      value: row.quantity_value,
      display: row.quantity_display,
    },
    unit: row.unit,
    unitNormalized: row.unit_normalized,
    name: row.ingredient_name,
    nameNormalized: row.ingredient_name_normalized,
    preparationNote: row.preparation_note,
    isOptional: row.is_optional ?? false,
    groupName: row.group_name,
    sortOrder: row.sort_order,
    isScalable: row.is_scalable ?? true,
    ingredientSlug: row.ingredient_slug,
  };
}

/**
 * Transform an array of database rows to domain types
 */
export function transformIngredients(
  rows: RecipeIngredientRow[]
): RecipeIngredient[] {
  return rows.map(transformIngredient);
}

/** Sort order, the id breaking ties: the order the shopping list's add RPC walks rows in. */
export function bySortOrder(a: RecipeIngredient, b: RecipeIngredient): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function transformIngredientsBundle(row: {
  base_servings: number | null;
  servings_unit: string | null;
  recipe_ingredients: RecipeIngredientRow[];
}): IngredientsBundle {
  return {
    baseServings: row.base_servings,
    servingsUnit: row.servings_unit,
    ingredients: transformIngredients(row.recipe_ingredients).sort(bySortOrder),
  };
}

/**
 * Group ingredients by their group_name
 * Returns groups in order of first appearance
 * Works with both RecipeIngredient and ScaledIngredient
 */
export function groupIngredients<T extends RecipeIngredient>(
  ingredients: T[]
): Array<{ name: string | null; ingredients: T[] }> {
  const groups = new Map<string | null, T[]>();

  // Group ingredients while preserving order
  for (const ingredient of ingredients) {
    const groupName = ingredient.groupName;
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(ingredient);
  }

  // Convert to array format
  const result: Array<{ name: string | null; ingredients: T[] }> = [];

  // Add ungrouped (null) first if it exists
  if (groups.has(null)) {
    result.push({
      name: null,
      ingredients: groups.get(null)!,
    });
  }

  // Add named groups in order of first appearance
  for (const [name, ingredients] of groups) {
    if (name !== null) {
      result.push({ name, ingredients });
    }
  }

  return result;
}
