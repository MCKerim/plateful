import { MockMealPlan, MockRecipe } from "../fixtures/types";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function createMealPlan(overrides?: Partial<MockMealPlan>): MockMealPlan {
  const id = overrides?.id ?? crypto.randomUUID();
  const defaultRecipeId = crypto.randomUUID();

  return {
    id,
    recipe_id: overrides?.recipe_id ?? defaultRecipeId,
    note_id: null,
    household_id: overrides?.household_id ?? crypto.randomUUID(),
    // Use 'in' check to distinguish between explicit null and undefined
    planned_date:
      overrides && "planned_date" in overrides
        ? (overrides.planned_date ?? null)
        : formatDate(new Date()),
    eaten: overrides?.eaten ?? false,
    created_at: overrides?.created_at ?? new Date().toISOString(),
    recipes: overrides?.recipes ?? { id: defaultRecipeId, name: "Test Recipe" },
    planner_notes: null,
  };
}

/** A note placed on a day (default today) or in the pool (`planned_date: null`). */
export function createNotePlan(overrides?: {
  id?: string;
  note_id?: string;
  household_id?: string;
  planned_date?: string | null;
  text?: string;
}): MockMealPlan {
  const noteId = overrides?.note_id ?? crypto.randomUUID();

  return {
    id: overrides?.id ?? crypto.randomUUID(),
    recipe_id: null,
    note_id: noteId,
    household_id: overrides?.household_id ?? crypto.randomUUID(),
    planned_date:
      overrides && "planned_date" in overrides
        ? (overrides.planned_date ?? null)
        : formatDate(new Date()),
    eaten: null,
    created_at: new Date().toISOString(),
    recipes: null,
    planner_notes: { id: noteId, text: overrides?.text ?? "Eating out" },
  };
}

export function createWeeklyMealPlans(
  recipes: MockRecipe[],
  householdId: string,
  startDate: Date = new Date()
): MockMealPlan[] {
  return recipes.slice(0, 7).map((recipe, index) =>
    createMealPlan({
      recipe_id: recipe.id,
      household_id: householdId,
      planned_date: formatDate(addDays(startDate, index)),
      recipes: { id: recipe.id, name: recipe.name },
    })
  );
}

export function createBacklogMealPlans(recipes: MockRecipe[], householdId: string): MockMealPlan[] {
  return recipes.map((recipe) =>
    createMealPlan({
      recipe_id: recipe.id,
      household_id: householdId,
      planned_date: null,
      recipes: { id: recipe.id, name: recipe.name },
    })
  );
}
