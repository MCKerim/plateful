import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import type { RecipePlacementRow } from "@/types/meal-planning.types";

/**
 * The household's whole recipe plan history in one request, shared by the
 * cookbook's cards (`useRecipeMealPlanInfos`) and its "not planned in a while"
 * sort (`useLastPlannedDates`); each reads its own view through `select`, which
 * must be a stable function so React Query can memoize it. Every plan mutation
 * invalidates `mealPlanning.all`, so it follows the plan.
 */
export function useRecipePlacements<T>(
  select: (rows: RecipePlacementRow[]) => T,
  enabled = true
) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.recipePlacements,
    queryFn: () => mealPlanningApi.getAllRecipePlacements(supabase),
    select,
    enabled,
  });
}
