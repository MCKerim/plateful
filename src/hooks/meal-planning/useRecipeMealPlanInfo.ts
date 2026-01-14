import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

export function useRecipeMealPlanInfo(recipeId: number | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.info(recipeId ?? 0),
    queryFn: async () => {
      if (!recipeId) return null;
      return mealPlanningApi.getInfoByRecipe(supabase, recipeId);
    },
    enabled: !!recipeId,
  });
}
