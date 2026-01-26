import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { mealPlanningApi } from "@/api/meal-planning.api";

export type SaveRecipePlansParams = {
  recipeId: number;
  householdId: number;
  datesToAdd: Date[];
  planIdsToRemove: number[];
  addWithoutDate: boolean;
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
            date.toISOString(),
            1
          )
        );
      }

      // Add without date if requested
      if (params.addWithoutDate) {
        operations.push(
          mealPlanningApi.create(supabase, params.recipeId, params.householdId, null, 1)
        );
      }

      await Promise.all(operations);

      return {
        added: params.datesToAdd.length + (params.addWithoutDate ? 1 : 0),
        removed: params.planIdsToRemove.length,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
