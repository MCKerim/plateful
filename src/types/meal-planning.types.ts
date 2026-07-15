export type MealPlannerItem = {
  id: string;
  recipeId: string;
  recipeName: string;
  planned_date: Date | null;
  eaten: boolean;
};

export type MealPlannerItemRaw = {
  id: string;
  planned_date: string | null;
  eaten: boolean;
  recipes: { id: string; name: string } | null;
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
  id: string;
  newDate: Date | null;
};

export type CreateMealPlanParams = {
  recipeId: string;
  householdId: string;
  date: Date | null;
};

export type RecipePlanEntry = {
  id: string;
  planned_date: Date | null;
};

export type RecipePlanEntryRaw = {
  id: string;
  planned_date: string | null;
};

export type SaveRecipePlansResult = {
  success: boolean;
  added: number;
  removed: number;
};

export type RecipeMealPlanInfo = {
  activePlan: {
    id: string;
    planned_date: string | null;
    eaten: boolean;
  } | null;
  lastPlannedDate: string | null;
};
