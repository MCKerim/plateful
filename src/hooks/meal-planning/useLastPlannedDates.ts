import { useRecipePlacements } from "./useRecipePlacements";
import { lastPlannedDates } from "@/lib/mealPlanHelper/mealPlanHelper";
import { toPlannedDateString } from "@/lib/dateHelper/dateHelper";
import type { RecipePlacementRow } from "@/types/meal-planning.types";

const selectLastPlannedDates = (rows: RecipePlacementRow[]) =>
  lastPlannedDates(rows, toPlannedDateString(new Date()));

/**
 * The last day each recipe was on the household's plan (recipe id → `yyyy-MM-dd`),
 * read from the whole plan history. Only computed while the cookbook sorts by it;
 * the rows themselves are the same request the cards' plan status uses.
 */
export function useLastPlannedDates(enabled: boolean) {
  return useRecipePlacements(selectLastPlannedDates, enabled);
}
