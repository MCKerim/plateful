import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

/**
 * The stored type of the recipe's newest typed placement (see
 * `getLastMealType`), for the weekly plan dialog; `null` (a note) loads
 * nothing. Fetched while the dialog is still closed, so it opens on the right
 * type instead of moving to it.
 */
export function useLastMealType(recipeId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.lastMealType(recipeId ?? ""),
    queryFn: () => (recipeId ? mealPlanningApi.getLastMealType(supabase, recipeId) : null),
    enabled: recipeId !== null,
  });
}
