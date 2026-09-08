import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

/**
 * The household's own note texts for the note dialog's chips. Under the
 * plan's query keys, so every plan mutation's invalidation refreshes it too.
 */
export function useNoteSuggestions(householdId: string | null, enabled: boolean) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.noteSuggestions(householdId ?? ""),
    queryFn: () => mealPlanningApi.getNoteSuggestions(supabase, householdId ?? ""),
    enabled: enabled && !!householdId,
  });
}
