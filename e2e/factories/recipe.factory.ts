import { MockRecipe } from "../fixtures/types";

export type RecipeCategory =
  | 1 // Breakfast
  | 2 // Main
  | 3 // Dessert
  | 4 // Drinks
  | 5; // Other

export function createRecipe(overrides?: Partial<MockRecipe>): MockRecipe {
  const id = overrides?.id ?? crypto.randomUUID();

  return {
    id,
    name: overrides?.name ?? `Test Recipe`,
    description: overrides?.description ?? "A delicious test recipe",
    category: overrides?.category ?? 2, // Main
    household_id: overrides?.household_id ?? crypto.randomUUID(),
    link: overrides?.link ?? null,
    owner_id: overrides?.owner_id ?? "test-user-id",
    created_at: overrides?.created_at ?? new Date().toISOString(),
    avg_rating: overrides?.avg_rating ?? null,
    collectionIds: overrides?.collectionIds ?? [],
  };
}

export function createRecipes(count: number, householdId: string): MockRecipe[] {
  return Array.from({ length: count }, (_, i) =>
    createRecipe({
      name: `Recipe ${i + 1}`,
      household_id: householdId,
      category: ((i % 5) + 1) as RecipeCategory,
    })
  );
}

export function createBreakfastRecipes(householdId: string): MockRecipe[] {
  return [
    createRecipe({ name: "Pancakes", category: 1, household_id: householdId }),
    createRecipe({ name: "Omelette", category: 1, household_id: householdId }),
    createRecipe({ name: "Smoothie Bowl", category: 1, household_id: householdId }),
  ];
}

export function createMainDishRecipes(householdId: string): MockRecipe[] {
  return [
    createRecipe({ name: "Spaghetti Bolognese", category: 2, household_id: householdId }),
    createRecipe({ name: "Chicken Curry", category: 2, household_id: householdId }),
    createRecipe({ name: "Grilled Salmon", category: 2, household_id: householdId }),
  ];
}
