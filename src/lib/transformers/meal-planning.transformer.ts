import { parseISO } from "date-fns";
import {
  MealPlannerItem,
  MealPlannerItemRaw,
  PlannedItemSummary,
  PlannedItemSummaryRaw,
} from "@/types/meal-planning.types";

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
 * Splits the plan's rows by what they carry. A row with neither a recipe nor
 * a note is a placement whose content is gone (nothing to show); it used to
 * render as a "-" line.
 */
export function transformMealPlannerItems(raw: MealPlannerItemRaw[]): MealPlannerItem[] {
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
        planned_date,
        eaten: row.eaten ?? false,
      });
    }
  }
  return items;
}

/** The weekly plan dialog's day chips: dated rows only, one label per row. */
export function transformPlannedItemsSummary(raw: PlannedItemSummaryRaw[]): PlannedItemSummary[] {
  const summary: PlannedItemSummary[] = [];
  for (const row of raw) {
    if (!row.planned_date) continue;
    if (row.planner_notes) {
      summary.push({ planned_date: row.planned_date, kind: "note", label: row.planner_notes.text });
    } else if (row.recipes) {
      summary.push({ planned_date: row.planned_date, kind: "recipe", label: row.recipes.name });
    }
  }
  return summary;
}
