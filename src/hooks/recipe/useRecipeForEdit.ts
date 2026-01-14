import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useRecipeForEdit(recipeId: number | null) {
  const { supabase } = useSupabase();

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipes.detail(recipeId ?? 0),
    queryFn: async () => {
      if (!recipeId) return null;
      return recipeApi.getById(supabase, recipeId);
    },
    enabled: !!recipeId,
  });

  const imageQuery = useQuery({
    queryKey: [...queryKeys.recipes.images(recipeId ?? 0), "edit"],
    queryFn: async () => {
      if (!recipeId) return null;
      return recipeApi.getImageWithPath(supabase, recipeId);
    },
    enabled: !!recipeId,
  });

  return {
    recipe: recipeQuery.data,
    isLoadingRecipe: recipeQuery.isLoading,
    imageInfo: imageQuery.data,
    isLoadingImage: imageQuery.isLoading,
    isLoading: recipeQuery.isLoading || imageQuery.isLoading,
  };
}
