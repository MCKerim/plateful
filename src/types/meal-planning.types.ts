/** When in the day a placement is eaten; a day lists them in this order. */
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

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
  /** The recipe's tags; the course tags among them preselect a meal type. */
  recipeTags: string[];
  /** The cover's public URL, carried by the week query so a row makes no request of its own. */
  coverUrl: string | null;
  planned_date: Date | null;
  mealType: MealType;
  eaten: boolean;
};

/**
 * A note on the plan. Copies made through "Edit plan" share `noteId`, so
 * editing the text changes every copy; moving and removing act on the single
 * placement. Notes have no cooked state and no meal type: a note is not a
 * meal, and a type an older build stored on its row is never read.
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
  meal_type: string | null;
  recipes: { id: string; name: string; tags: string[]; image_path: string | null } | null;
  planner_notes: { id: string; text: string } | null;
};

/** What the Plan sheet plans: a recipe (its cover for the row it adds), or a note (every copy shares the text). */
export type PlanSubject =
  | { kind: "recipe"; id: string; name: string; tags: string[]; coverUrl: string | null }
  | { kind: "note"; noteId: string; text: string };

export type UpdatePlannedItemParams = {
  id: string;
  newDate: Date | null;
};

/** One recipe placement as the sort reads it: which recipe, which day (`null` in the pool), cooked or not. */
export type RecipePlacementRow = {
  recipe_id: string;
  planned_date: string | null;
  eaten: boolean;
};

/** What a card says about the plan: the next placement (`planned_date` null = an uncooked pool copy), else the last day the recipe was on the plan. */
export type RecipeMealPlanInfo = {
  activePlan: { planned_date: string | null } | null;
  lastPlannedDate: string | null;
};
