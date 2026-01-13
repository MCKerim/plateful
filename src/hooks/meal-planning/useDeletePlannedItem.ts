import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { MealPlannerItem } from "@/types/meal-planning.types";

export function useDeletePlannedItem() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await mealPlanningApi.delete(supabase, id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.all });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.all,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.all },
        (old) => old?.filter((item) => item.id !== id)
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
