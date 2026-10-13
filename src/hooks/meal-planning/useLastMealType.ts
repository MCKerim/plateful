import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { planSubjectKey } from "@/lib/mealPlanHelper/mealPlanHelper";
import { PlanSubject } from "@/types/meal-planning.types";

/**
 * The stored type of the subject's newest typed placement (see
 * `getLastMealType`), for the weekly plan dialog. Fetched while the dialog is
 * still closed, so it opens on the right type instead of moving to it.
 */
export function useLastMealType(subject: PlanSubject | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.mealPlanning.lastMealType(subject ? planSubjectKey(subject) : ""),
    queryFn: () => (subject ? mealPlanningApi.getLastMealType(supabase, subject) : null),
    enabled: subject !== null,
  });
}
