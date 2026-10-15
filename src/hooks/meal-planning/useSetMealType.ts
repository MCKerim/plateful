import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";
import { MealPlannerItem, MealType } from "@/types/meal-planning.types";

/** Changes one recipe placement's meal type, optimistically like the cooked check. A note has none. */
export function useSetMealType() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mealType }: { id: string; mealType: MealType }) => {
      await mealPlanningApi.setMealType(supabase, id, mealType);
    },
    onMutate: async ({ id, mealType }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.mealPlanning.all });

      const previousData = queryClient.getQueriesData<MealPlannerItem[]>({
        queryKey: queryKeys.mealPlanning.all,
      });

      queryClient.setQueriesData<MealPlannerItem[]>(
        { queryKey: queryKeys.mealPlanning.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((item) =>
            item.id === id && item.kind === "recipe" ? { ...item, mealType } : item
          );
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
