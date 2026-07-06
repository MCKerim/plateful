import { SupabaseClient } from "@supabase/supabase-js";

/**
 * The seven per-serving nutrition metrics, keyed exactly like the `recipes`
 * table columns. `null` means "not calculated" (the whole card is hidden when
 * every value is null).
 */
export type NutritionValues = {
  calories_kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  sugar_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
};

export type NutritionEstimateInput = {
  title: string;
  servings: number | null;
  /** Human-readable ingredient lines, e.g. "200 g flour". At least one. */
  ingredients: string[];
};

/**
 * The recipe-extractor's estimate route replies in camelCase (its zod schema),
 * NOT the snake_case DB columns — so we map on the way in.
 */
type NutritionEstimateResponse = {
  nutrition: {
    caloriesKcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    sugarG: number;
    fiberG: number;
    sodiumMg: number;
  };
};

const ESTIMATE_ENDPOINT = "https://extractor.plateful.cloud/api/nutrition/estimate";

export const nutritionApi = {
  /**
   * Estimates nutrition per serving for the recipe as it currently sits in the
   * editor (unsaved edits included). The extractor verifies the caller's
   * Supabase JWT and returns the values without persisting anything — saving
   * happens through the normal recipe-save path. Mirrors the iOS
   * `NutritionEstimator`.
   */
  async estimate(
    supabase: SupabaseClient,
    input: NutritionEstimateInput
  ): Promise<NutritionValues> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(ESTIMATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: input.title,
        servings: input.servings,
        ingredients: input.ingredients,
      }),
    });

    if (!response.ok) {
      throw new Error(`Nutrition estimate failed (${response.status})`);
    }

    const { nutrition } = (await response.json()) as NutritionEstimateResponse;
    return {
      calories_kcal: nutrition.caloriesKcal,
      carbs_g: nutrition.carbsG,
      protein_g: nutrition.proteinG,
      fat_g: nutrition.fatG,
      sugar_g: nutrition.sugarG,
      fiber_g: nutrition.fiberG,
      sodium_mg: nutrition.sodiumMg,
    };
  },
};
