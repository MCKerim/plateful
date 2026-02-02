export type MealPlannerItem = {
  id: number;
  recipeId: number;
  recipeName: string;
  planned_date: Date | null;
  eaten: boolean;
};

export type MealPlannerItemRaw = {
  id: number;
  planned_date: string | null;
  eaten: boolean;
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
};

export type CreateMealPlanParams = {
  recipeId: number;
  householdId: number;
  date: Date | null;
};

export type RecipePlanEntry = {
  id: number;
  planned_date: Date | null;
};

export type RecipePlanEntryRaw = {
  id: number;
  planned_date: string | null;
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
    eaten: boolean;
  } | null;
  lastPlannedDate: string | null;
};
