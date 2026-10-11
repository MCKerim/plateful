import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ingredientsApi } from "@/api/ingredients.api";
import { transformIngredientsBundle } from "@/lib/transformers/ingredient.transformer";
import type { IngredientsBundle } from "@/types/ingredient.types";

/**
 * The rows and serving config of several recipes by recipe id, fetched fresh
 * when `enabled` turns on (the add-to-list sheets). A recipe deleted since gets
 * an empty bundle, so every id counts as loaded.
 */
export function useIngredientsBundles(recipeIds: string[], enabled: boolean) {
  const { supabase } = useSupabase();
  const ids = [...new Set(recipeIds)].sort();

  return useQuery({
    queryKey: queryKeys.recipes.bundles(ids),
    queryFn: async () => {
      const rows = await ingredientsApi.getBundles(supabase, ids);
      const bundles = new Map<string, IngredientsBundle>(
        ids.map((id) => [id, { baseServings: null, servingsUnit: null, ingredients: [] }])
      );
      for (const row of rows) bundles.set(row.id, transformIngredientsBundle(row));
      return bundles;
    },
    enabled: enabled && ids.length > 0,
    staleTime: 0,
  });
}
