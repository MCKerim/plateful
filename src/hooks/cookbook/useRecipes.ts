import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { cookbookApi } from "@/api/cookbook.api";
import { transformCookbookRecipes } from "@/lib/transformers/cookbook.transformer";
import { useRef, useEffect } from "react";
import { CookbookRecipe } from "@/types/cookbook.types";

export function useRecipes() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const previousDataRef = useRef<CookbookRecipe[] | undefined>();

  const query = useQuery({
    queryKey: queryKeys.recipes.list,
    queryFn: async () => {
      const data = await cookbookApi.getRecipesWithRatings(supabase);
      return transformCookbookRecipes(data);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: (q) => {
      const recipes = q.state.data;
      const hasImportingRecipes = recipes?.some((r) => r.status === "importing");
      return hasImportingRecipes ? 5000 : false; // Poll every 5s when importing
    },
  });

  // Invalidate image queries when recipes finish importing
  useEffect(() => {
    const previousData = previousDataRef.current;
    const currentData = query.data;

    if (previousData && currentData) {
      // Find recipes that changed from "importing" to "ready"
      const finishedImporting = currentData.filter((recipe) => {
        const prev = previousData.find((r) => r.id === recipe.id);
        return prev?.status === "importing" && recipe.status === "ready";
      });

      // Invalidate image queries for finished imports
      finishedImporting.forEach((recipe) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.images(recipe.id),
        });
      });
    }

    previousDataRef.current = currentData;
  }, [query.data, queryClient]);

  return query;
}
