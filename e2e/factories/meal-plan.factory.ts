import { MockMealPlan, MockRecipe } from "../fixtures/types";

let mealPlanIdCounter = 1;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function createMealPlan(overrides?: Partial<MockMealPlan>): MockMealPlan {
  const id = overrides?.id ?? mealPlanIdCounter++;

  return {
    id,
    recipe_id: overrides?.recipe_id ?? 1,
    household_id: overrides?.household_id ?? 1,
    // Use 'in' check to distinguish between explicit null and undefined
    planned_date:
      overrides && "planned_date" in overrides
        ? (overrides.planned_date ?? null)
        : formatDate(new Date()),
    days: overrides?.days ?? 1,
    daysEaten: overrides?.daysEaten ?? 0,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    recipes: overrides?.recipes ?? { id: 1, name: "Test Recipe" },
  };
}

export function createWeeklyMealPlans(
  recipes: MockRecipe[],
  householdId: number,
  startDate: Date = new Date()
): MockMealPlan[] {
  return recipes.slice(0, 7).map((recipe, index) =>
    createMealPlan({
      recipe_id: recipe.id,
      household_id: householdId,
      planned_date: formatDate(addDays(startDate, index)),
      days: 1,
      recipes: { id: recipe.id, name: recipe.name },
    })
  );
}

export function createBacklogMealPlans(recipes: MockRecipe[], householdId: number): MockMealPlan[] {
  return recipes.map((recipe) =>
    createMealPlan({
      recipe_id: recipe.id,
      household_id: householdId,
      planned_date: null,
      days: 2,
      recipes: { id: recipe.id, name: recipe.name },
    })
  );
}
