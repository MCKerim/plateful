import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeShareApi } from "@/api/recipeShare.api";

export function useRecipeShare(token: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.sharedRecipes.byToken(token ?? ""),
    queryFn: async () => {
      if (!token) return null;
      return recipeShareApi.getByToken(supabase, token);
    },
    enabled: !!token,
    // Shared recipes are stable snapshots — cache aggressively
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
