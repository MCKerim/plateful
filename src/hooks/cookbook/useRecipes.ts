import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { cookbookApi } from "@/api/cookbook.api";
import { transformCookbookRecipes } from "@/lib/transformers/cookbook.transformer";

export function useRecipes() {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.list,
    queryFn: async () => {
      const data = await cookbookApi.getRecipesWithRatings(supabase);
      return transformCookbookRecipes(data);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
