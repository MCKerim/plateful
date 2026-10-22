import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeOriginalApi } from "@/api/recipeOriginal.api";
import { AnalyticsEvent } from "@/lib/analyticsEvents";

export function useResetRecipeToOriginal() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: ({ recipeId }: { recipeId: string; originalId: string }) =>
      recipeOriginalApi.reset(supabase, recipeId),
    // Here, not in the caller's mutate() callbacks, which are skipped when the
    // page is left during the call.
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.recipeResetToOriginal);
    },
    // Settled, not success: a reset that failed midway may still have rewritten
    // some rows, and a successful one may have cached a new translation.
    onSettled: async (_data, _error, { originalId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mealPlanning.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipeOriginals.detail(originalId) }),
      ]);
    },
  });
}
