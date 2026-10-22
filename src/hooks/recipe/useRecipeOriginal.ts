import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeOriginalApi } from "@/api/recipeOriginal.api";

export function useRecipeOriginal(originalId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipeOriginals.detail(originalId ?? ""),
    queryFn: () => recipeOriginalApi.getById(supabase, originalId!),
    enabled: !!originalId,
  });
}
