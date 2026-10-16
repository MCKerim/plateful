import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { recipeImportApi } from "@/api/recipeImport.api";
import { queryKeys } from "@/lib/query-keys";
import { contentLanguage } from "@/lib/contentLanguage";
import { SHARE_BASE_URL } from "@/hooks/recipe/useCreateRecipeShare";

type ImportParams = {
  token: string;
  householdId: string;
};

/**
 * Saves a shared recipe by importing its link, the same import a pasted share
 * link starts: the extractor copies the share as it is and sorts it into the
 * household's folders, so both ways end in the same recipe.
 */
export function useImportRecipeShare() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, householdId }: ImportParams) => {
      try {
        await recipeImportApi.createUrlImport(supabase, {
          url: `${SHARE_BASE_URL}/${token}`,
          householdId,
          language: contentLanguage(),
        });
      } catch (error) {
        // The duplicate guard: this share was saved moments ago and is
        // already on its way, so it counts as saved.
        if ((error as { code?: string }).code !== "23505") throw error;
      }
    },
    onSuccess: async () => {
      posthog?.capture(AnalyticsEvent.sharedRecipeImported);
      await queryClient.invalidateQueries({ queryKey: queryKeys.recipeImports.all });
    },
  });
}
