import { useQuery, keepPreviousData, queryOptions } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { useSupabase } from "@/utils/supabase";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { useWeekStart } from "@/hooks/user/useWeekStart";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { recipeImageUrl } from "@/api/recipe.api";
import { transformMealPlannerItems } from "@/lib/transformers/meal-planning.transformer";

/** The pool and the week holding `week`, on the one cache key the planner and the Plan sheet share. */
export function mealPlannerItemsQuery(supabase: SupabaseClient, week: Date, firstWeekday: number) {
  const weekDays = getWeekdays(week, firstWeekday);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return queryOptions({
    queryKey: queryKeys.mealPlanning.list(weekStart.toISOString()),
    queryFn: async () => {
      const data = await mealPlanningApi.getItemsForWeek(supabase, weekStart, weekEnd);
      return transformMealPlannerItems(data, (imagePath) => recipeImageUrl(supabase, imagePath));
    },
  });
}

export function useMealPlannerItems(currentWeek: Date) {
  const { supabase } = useSupabase();
  const firstWeekday = useWeekStart();

  return useQuery({
    ...mealPlannerItemsQuery(supabase, currentWeek, firstWeekday),
    refetchInterval: 1000 * 30, // Poll every 30s for household sync
    placeholderData: keepPreviousData,
  });
}
