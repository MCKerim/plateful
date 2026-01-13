import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import {
  MealPlannerItem,
  UpdatePlannedItemParams,
} from "@/types/meal-planning.types";

export function useUpdatePlannedItemDate() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newDate, newDays }: UpdatePlannedItemParams) => {
      const plannedDate = newDate ? newDate.toISOString() : null;
      await mealPlanningApi.updateDate(supabase, id, plannedDate, newDays);
    },
    onMutate: async ({ id, newDate, newDays }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.all });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.all,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.all },
        (old) =>
          old?.map((item) =>
            item.id === id
              ? { ...item, planned_date: newDate, days: newDays }
              : item
          )
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
