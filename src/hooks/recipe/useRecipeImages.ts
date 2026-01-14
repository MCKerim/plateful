import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useRecipeImages(recipeId: number | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.images(recipeId ?? 0),
    queryFn: async () => {
      if (!recipeId) return [];
      return recipeApi.getImages(supabase, recipeId);
    },
    enabled: !!recipeId,
  });
}
