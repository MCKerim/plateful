import { parseISO } from "date-fns";
import { MEAL_TYPES } from "@/lib/mealPlanHelper/mealPlanHelper";
import { MealPlannerItem, MealPlannerItemRaw, MealType } from "@/types/meal-planning.types";

/**
 * `planned_date` is a Postgres `date` ("2026-09-13"): a calendar day with no
 * timezone. `parseISO` reads it as local midnight; `new Date("2026-09-13")`
 * would read it as UTC midnight, which is the previous evening anywhere west
 * of Greenwich.
 */
export function parsePlannedDate(value: string | null): Date | null {
  return value ? parseISO(value) : null;
}

/**
 * A recipe placement's type. NULL comes from clients that set no type (older
 * builds of this app and of iOS) and reads as dinner, as does a value this
 * version doesn't know.
 */
export function parseMealType(value: string | null): MealType {
  return MEAL_TYPES.find((type) => type === value) ?? "dinner";
}

/**
 * Splits the plan's rows by what they carry. A row with neither a recipe nor
 * a note is a placement whose content is gone (nothing to show); it used to
 * render as a "-" line.
 */
export function transformMealPlannerItems(
  raw: MealPlannerItemRaw[],
  coverUrlOf: (imagePath: string | null) => string | null
): MealPlannerItem[] {
  const items: MealPlannerItem[] = [];
  for (const row of raw) {
    const planned_date = parsePlannedDate(row.planned_date);
    if (row.planner_notes) {
      items.push({
        kind: "note",
        id: row.id,
        noteId: row.planner_notes.id,
        text: row.planner_notes.text,
        planned_date,
      });
    } else if (row.recipes) {
      items.push({
        kind: "recipe",
        id: row.id,
        recipeId: row.recipes.id,
        recipeName: row.recipes.name,
        recipeTags: row.recipes.tags,
        coverUrl: coverUrlOf(row.recipes.image_path),
        planned_date,
        mealType: parseMealType(row.meal_type),
        eaten: row.eaten ?? false,
      });
    }
  }
  return items;
}
