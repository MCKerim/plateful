import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ingredientsApi } from "@/api/ingredients.api";
import { transformIngredients } from "@/lib/transformers/ingredient.transformer";

export function useRecipeIngredients(recipeId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.ingredients(recipeId ?? ""),
    queryFn: async () => {
      if (!recipeId) return [];
      const rows = await ingredientsApi.getByRecipeId(supabase, recipeId);
      return transformIngredients(rows);
    },
    enabled: !!recipeId,
  });
}
