import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { recipeShareApi } from "@/api/recipeShare.api";
import type { SharedRecipeSnapshot } from "@/types/recipeShare.types";

type ImportParams = {
  snapshot: SharedRecipeSnapshot;
  householdId: string;
};

export function useImportRecipeShare() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: ({ snapshot, householdId }: ImportParams) =>
      recipeShareApi.importIntoHousehold(supabase, snapshot, householdId),
  });
}
