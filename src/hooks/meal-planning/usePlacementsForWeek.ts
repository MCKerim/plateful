import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import { useWeekStart } from "@/hooks/user/useWeekStart";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { parsePlannedDate } from "@/lib/transformers/meal-planning.transformer";
import { planSubjectKey } from "@/lib/mealPlanHelper/mealPlanHelper";
import { PlacementEntry, PlanSubject } from "@/types/meal-planning.types";

/** A recipe's or a note's dated placements in the shown week (the weekly plan dialog). */
export function usePlacementsForWeek(
  subject: PlanSubject | null,
  currentWeek: Date,
  enabled: boolean
) {
  const { supabase } = useSupabase();
  const firstWeekday = useWeekStart();

  const weekDays = getWeekdays(currentWeek, firstWeekday);
  const weekStart = new Date(weekDays[0]);
  const weekEnd = new Date(weekDays[6]);

  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  return useQuery({
    queryKey: queryKeys.mealPlanning.placements(
      subject ? planSubjectKey(subject) : "",
      weekStart.toISOString()
    ),
    queryFn: async (): Promise<PlacementEntry[]> => {
      if (!subject) return [];

      const raw = await mealPlanningApi.getPlacementsInWeek(supabase, subject, weekStart, weekEnd);

      return raw.map((item) => ({
        id: item.id,
        planned_date: parsePlannedDate(item.planned_date),
      }));
    },
    enabled: enabled && subject !== null,
    placeholderData: keepPreviousData,
  });
}
