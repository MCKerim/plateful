import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ApplyPlannerChangesParams, mealPlanningApi } from "@/api/meal-planning.api";

export type ApplyPlannerChangesResult = {
  added: number;
  removed: number;
};

/**
 * The weekly plan dialog's save, for a recipe or a note: every added day and
 * pool copy plus every deselected day in one server transaction. The caller
 * mints the insertion ids and keeps them while its selection is unchanged, so
 * a retry after a lost response cannot plan a day twice.
 */
export function useApplyPlannerChanges(options?: {
  onSuccess?: (result: ApplyPlannerChangesResult, variables: ApplyPlannerChangesParams) => void;
}) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ApplyPlannerChangesParams): Promise<ApplyPlannerChangesResult> => {
      await mealPlanningApi.applyPlannerChanges(supabase, params);
      return { added: params.insertions.length, removed: params.deleteIds.length };
    },
    onSuccess: (result, variables) => {
      options?.onSuccess?.(result, variables);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all });
    },
  });
}
