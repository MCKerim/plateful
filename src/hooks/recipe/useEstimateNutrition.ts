import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { nutritionApi, NutritionEstimateInput, NutritionValues } from "@/api/nutrition.api";

/**
 * Calls the recipe-extractor to estimate the 7 per-serving metrics for the
 * recipe currently in the editor. Returns the values; the caller drops them
 * into the form and they persist on the normal save. Nothing is written here.
 */
export function useEstimateNutrition() {
  const { supabase } = useSupabase();
  const posthog = usePostHog();

  return useMutation<NutritionValues, Error, NutritionEstimateInput>({
    mutationFn: (input) => nutritionApi.estimate(supabase, input),
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.nutritionCalculated);
    },
  });
}
