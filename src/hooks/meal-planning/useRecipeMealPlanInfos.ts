import { useRecipePlacements } from "./useRecipePlacements";
import { recipeMealPlanInfos } from "@/lib/mealPlanHelper/mealPlanHelper";
import { toPlannedDateString } from "@/lib/dateHelper/dateHelper";
import type { RecipePlacementRow } from "@/types/meal-planning.types";

const selectRecipeMealPlanInfos = (rows: RecipePlacementRow[]) =>
  recipeMealPlanInfos(rows, toPlannedDateString(new Date()));

/**
 * The plan status of every recipe card at once (recipe id → info), from one
 * read of the household's plan history. Before this, each card asked for its
 * own rows, and a 454-recipe cookbook opened with 900 requests
 * (docs/knowledge/supabase-connection-limit.md).
 */
export function useRecipeMealPlanInfos() {
  return useRecipePlacements(selectRecipeMealPlanInfos);
}
