import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useDeleteRecipe() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      return recipeApi.delete(supabase, recipeId);
    },
    onSettled: async (_data, _error, recipeId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(recipeId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all }),
      ]);
    },
  });
}
