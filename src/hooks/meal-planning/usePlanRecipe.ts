import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

export type PlanRecipeParams = {
  recipeId: number;
  householdId: number;
  plannedDate: Date | null;
  days: number;
};

export function usePlanRecipe() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PlanRecipeParams) => {
      const dateString = params.plannedDate?.toDateString() ?? null;
      await mealPlanningApi.create(
        supabase,
        params.recipeId,
        params.householdId,
        dateString,
        params.days
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
