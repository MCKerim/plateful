/**
 * The plan as the client uses it. Every entry is one `meal_planning` row (a
 * placement on a day or in the pool) carrying exactly one kind of content: a
 * recipe, or a note ("Eating out", "Birthday") for a day the household won't
 * cook. `id` is always the placement; it is what gets dragged, moved and
 * removed.
 */
export type PlannedRecipe = {
  kind: "recipe";
  id: string;
  recipeId: string;
  recipeName: string;
  planned_date: Date | null;
  eaten: boolean;
};

/**
 * A note on the plan. Copies made through "Edit plan" share `noteId`, so
 * editing the text changes every copy; moving and removing act on the single
 * placement. Notes have no cooked state.
 */
export type PlannedNote = {
  kind: "note";
  id: string;
  noteId: string;
  text: string;
  planned_date: Date | null;
};

export type MealPlannerItem = PlannedRecipe | PlannedNote;

/** A `meal_planning` row as selected: exactly one of `recipes` / `planner_notes` is set. */
export type MealPlannerItemRaw = {
  id: string;
  planned_date: string | null;
  eaten: boolean | null;
  recipes: { id: string; name: string } | null;
  planner_notes: { id: string; text: string } | null;
};

export type PlannedItemSummaryRaw = {
  planned_date: string | null;
  recipes: { name: string } | null;
  planner_notes: { text: string } | null;
};

/** What a day holds, for the weekly plan dialog's chips: a recipe's name or a note's text. */
export type PlannedItemSummary = {
  planned_date: string;
  kind: "recipe" | "note";
  label: string;
};

/** What the weekly plan dialog plans: a recipe, or a note (every copy shares the text). */
export type PlanSubject =
  | { kind: "recipe"; id: string; name: string }
  | { kind: "note"; noteId: string; text: string };

export type UpdatePlannedItemParams = {
  id: string;
  newDate: Date | null;
};

/** One placement of a plan subject: the row id and its day (`null` in the pool). */
export type PlacementEntry = {
  id: string;
  planned_date: Date | null;
};

export type PlacementEntryRaw = {
  id: string;
  planned_date: string | null;
};

export type RecipeMealPlanInfo = {
  activePlan: {
    id: string;
    planned_date: string | null;
    eaten: boolean;
  } | null;
  lastPlannedDate: string | null;
};
