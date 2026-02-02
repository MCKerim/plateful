import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { MealPlannerItem } from "@/types/meal-planning.types";

export function useSetEaten() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eaten }: { id: number; eaten: boolean }) => {
      await mealPlanningApi.setEaten(supabase, id, eaten);
    },
    onMutate: async ({ id, eaten }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.all });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.all,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((item) => (item.id === id ? { ...item, eaten } : item));
        }
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
