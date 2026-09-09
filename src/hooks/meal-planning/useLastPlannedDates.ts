import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { lastPlannedDates } from "@/lib/mealPlanHelper/mealPlanHelper";
import { toPlannedDateString } from "@/lib/dateHelper/dateHelper";

/**
 * The last day each recipe was on the household's plan (recipe id → `yyyy-MM-dd`),
 * read from the whole plan history. Only fetched while the cookbook sorts by it;
 * every plan mutation invalidates `mealPlanning.all`, so it follows the plan.
 */
export function useLastPlannedDates(enabled: boolean) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.lastPlanned,
    queryFn: async () =>
      lastPlannedDates(
        await mealPlanningApi.getAllRecipePlacements(supabase),
        toPlannedDateString(new Date())
      ),
    enabled,
  });
}
