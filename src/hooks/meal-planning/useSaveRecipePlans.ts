import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

export type SaveRecipePlansParams = {
  recipeId: number;
  householdId: number;
  datesToAdd: Date[];
  planIdsToRemove: number[];
  withoutDateCount: number;
};

export type SaveRecipePlansResult = {
  added: number;
  removed: number;
};

export function useSaveRecipePlans() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveRecipePlansParams): Promise<SaveRecipePlansResult> => {
      const operations: Promise<void>[] = [];

      // Delete removed plans
      for (const id of params.planIdsToRemove) {
        operations.push(mealPlanningApi.delete(supabase, id));
      }

      // Create new plans for selected dates
      for (const date of params.datesToAdd) {
        operations.push(
          mealPlanningApi.create(
            supabase,
            params.recipeId,
            params.householdId,
            date.toISOString()
          )
        );
      }

      // Add without date entries
      for (let i = 0; i < params.withoutDateCount; i++) {
        operations.push(
          mealPlanningApi.create(supabase, params.recipeId, params.householdId, null)
        );
      }

      await Promise.all(operations);

      return {
        added: params.datesToAdd.length + params.withoutDateCount,
        removed: params.planIdsToRemove.length,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
