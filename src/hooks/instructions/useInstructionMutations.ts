import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { instructionsApi } from "@/api/instructions.api";
import type { RecipeInstructionInput } from "@/types/instruction.types";

export function useReplaceAllInstructions() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      inputs,
    }: {
      recipeId: string;
      inputs: RecipeInstructionInput[];
    }) => {
      return instructionsApi.replaceAll(supabase, recipeId, inputs);
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.instructions(variables.recipeId),
      });
    },
  });
}
