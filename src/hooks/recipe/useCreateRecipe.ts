import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi, CreateRecipeParams } from "@/api/recipe.api";

export function useCreateRecipe() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateRecipeParams) => {
      return recipeApi.create(supabase, params);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.all,
      });
    },
  });
}
