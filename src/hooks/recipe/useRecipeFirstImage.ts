import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useRecipeFirstImage(recipeId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: [...queryKeys.recipes.images(recipeId ?? ""), "first"],
    queryFn: async () => {
      if (!recipeId) return null;
      return recipeApi.getFirstImage(supabase, recipeId);
    },
    enabled: !!recipeId,
  });
}
