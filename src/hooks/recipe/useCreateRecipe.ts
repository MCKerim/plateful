import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { recipeApi, CreateRecipeParams } from "@/api/recipe.api";

export function useCreateRecipe() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (params: CreateRecipeParams) => {
      return recipeApi.create(supabase, params);
    },
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.recipeCreated);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}
