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

export type RecipePlanEntry = {
  id: number;
  planned_date: Date | null;
  days: number;
};

export type RecipePlanEntryRaw = {
  id: number;
  planned_date: string | null;
  days: number;
};

export type SaveRecipePlansResult = {
  success: boolean;
  added: number;
  removed: number;
};

export type RecipeMealPlanInfo = {
  activePlan: {
    id: number;
    planned_date: string | null;
    days: number;
    daysEaten: number;
  } | null;
  lastPlannedDate: string | null;
};
