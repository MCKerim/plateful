import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { instructionsApi } from "@/api/instructions.api";
import { transformInstructions } from "@/lib/transformers/instruction.transformer";

export function useRecipeInstructions(recipeId: string | null) {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.instructions(recipeId ?? ""),
    queryFn: async () => {
      if (!recipeId) return [];
      const rows = await instructionsApi.getByRecipeId(supabase, recipeId);
      return transformInstructions(rows);
    },
    enabled: !!recipeId,
  });
}
