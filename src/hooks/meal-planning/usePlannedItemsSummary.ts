import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { getWeekdays } from "@/lib/dateHelper";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

export function usePlannedItemsSummary(currentWeek: Date, enabled: boolean) {
  const { supabase } = useSupabase();

  const weekDays = getWeekdays(currentWeek);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: queryKeys.mealPlanning.summary(weekStart.toISOString()),
    queryFn: () =>
      mealPlanningApi.getSummaryForWeek(supabase, weekStart, weekEnd),
    enabled,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}
