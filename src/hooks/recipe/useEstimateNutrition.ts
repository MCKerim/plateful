import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { nutritionApi, NutritionEstimateInput, NutritionValues } from "@/api/nutrition.api";

/**
 * Calls the recipe-extractor to estimate the 7 per-serving metrics for the
 * recipe currently in the editor. Returns the values; the caller drops them
 * into the form and they persist on the normal save. Nothing is written here.
 */
export function useEstimateNutrition() {
  const { supabase } = useSupabase();

  return useMutation<NutritionValues, Error, NutritionEstimateInput>({
    mutationFn: (input) => nutritionApi.estimate(supabase, input),
  });
}
