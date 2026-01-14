import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useRecipe(recipeId: number | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.detail(recipeId ?? 0),
    queryFn: async () => {
      if (!recipeId) return null;
      return recipeApi.getById(supabase, recipeId);
    },
    enabled: !!recipeId,
  });
}
