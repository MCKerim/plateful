import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { recipeShareApi } from "@/api/recipeShare.api";
import type { SharedRecipeSnapshot } from "@/types/recipeShare.types";

type ImportParams = {
  snapshot: SharedRecipeSnapshot;
  householdId: string;
};

export function useImportRecipeShare() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: ({ snapshot, householdId }: ImportParams) =>
      recipeShareApi.importIntoHousehold(supabase, snapshot, householdId),
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.sharedRecipeImported);
    },
  });
}
