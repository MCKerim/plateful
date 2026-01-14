import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi, UpdateRecipeParams } from "@/api/recipe.api";

export function useUpdateRecipe() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateRecipeParams) => {
      return recipeApi.update(supabase, params);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(variables.recipeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.images(variables.recipeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.all,
      });
    },
  });
}
