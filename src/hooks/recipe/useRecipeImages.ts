import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";

export function useRecipeImages(recipeId: string | null) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.recipes.images(recipeId ?? ""),
    queryFn: async () => {
      if (!recipeId) return [];
      return recipeApi.getImages(supabase, recipeId);
    },
    enabled: !!recipeId,
    // Use cached first image as placeholder while loading all images
    placeholderData: () => {
      if (!recipeId) return undefined;
      const firstImage = queryClient.getQueryData<string | null>([
        ...queryKeys.recipes.images(recipeId),
        "first",
      ]);
      return firstImage ? [firstImage] : undefined;
    },
  });
}
