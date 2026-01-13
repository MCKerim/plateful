import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { MealPlannerItem } from "@/types/meal-planning.types";

export function useSetDaysEaten() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newDaysEaten,
    }: {
      id: number;
      newDaysEaten: number;
    }) => {
      await mealPlanningApi.updateDaysEaten(supabase, id, newDaysEaten);
    },
    onMutate: async ({ id, newDaysEaten }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.all });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.all,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.all },
        (old) =>
          old?.map((item) =>
            item.id === id ? { ...item, daysEaten: newDaysEaten } : item
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
