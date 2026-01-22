import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { transformMealPlannerItems } from "@/lib/transformers/meal-planning.transformer";

export function useMealPlannerItems(currentWeek: Date) {
  const { supabase } = useSupabase();

  const weekDays = getWeekdays(currentWeek);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: queryKeys.mealPlanning.list(weekStart.toISOString()),
    queryFn: async () => {
      const data = await mealPlanningApi.getItemsForWeek(
        supabase,
        weekStart,
        weekEnd
      );
      return transformMealPlannerItems(data);
    },
    refetchInterval: 1000 * 30, // Poll every 30s for household sync
    placeholderData: keepPreviousData,
  });
}
