import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { RecipePlanEntry } from "@/types/meal-planning.types";

export function useRecipePlansForWeek(
  recipeId: string | null,
  currentWeek: Date,
  enabled: boolean
) {
  const { supabase } = useSupabase();

  const weekDays = getWeekdays(currentWeek);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: queryKeys.mealPlanning.recipePlans(recipeId ?? "", weekStart.toISOString()),
    queryFn: async (): Promise<RecipePlanEntry[]> => {
      if (!recipeId) return [];

      const raw = await mealPlanningApi.getPlansForRecipeInWeek(
        supabase,
        recipeId,
        weekStart,
        weekEnd
      );

      return raw.map((item) => ({
        id: item.id,
        planned_date: item.planned_date ? new Date(item.planned_date) : null,
      }));
    },
    enabled: enabled && recipeId !== null,
    placeholderData: keepPreviousData,
  });
}
