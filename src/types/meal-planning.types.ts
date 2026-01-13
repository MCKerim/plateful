export type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  planned_date: Date | null;
  days: number;
  daysEaten: number;
};

export type MealPlannerItemRaw = {
  id: number;
  planned_date: string | null;
  days: number;
  daysEaten: number;
  recipes: { id: number; name: string } | null;
};

export type PlannedItemSummaryRaw = {
  planned_date: string | null;
  recipes: { name: string } | null;
};

export type PlannedItemSummary = {
  planned_date: string;
  recipe_name: string;
};

export type UpdatePlannedItemParams = {
  id: number;
  newDate: Date | null;
  newDays: number;
};

export type CreateMealPlanParams = {
  recipeId: number;
  householdId: number;
  date: Date | null;
  days: number;
};
