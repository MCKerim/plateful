import { SupabaseClient } from "@supabase/supabase-js";

/**
 * The seven per-serving nutrition metrics, keyed exactly like the `recipes`
 * table columns. `null` means "not calculated" (the whole card is hidden when
 * every value is null and no estimate is pending).
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

const REFRESH_ENDPOINT = "https://extractor.plateful.cloud/api/nutrition/refresh";

export const nutritionApi = {
  /**
   * Asks the backend to re-estimate a SAVED recipe's nutrition — the
   * automatic-update path (contract: the iOS repo's
   * docs/system-architecture.md). The extractor verifies the caller's
   * Supabase JWT, checks the recipe belongs to their household, sets
   * `nutrition_pending` (the card's loading state) and queues a worker job
   * that overwrites the seven columns; the values arrive via the normal
   * Realtime → refetch path, so the user can leave the page. Call it after a
   * save whose ingredient rows are already written — the worker estimates
   * from those. Replaces the deleted Calculate button's `estimate` route
   * (which the extractor keeps serving for older installed clients). Mirrors
   * the iOS `NutritionRefresher`.
   */
  async refresh(supabase: SupabaseClient, recipeId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (!response.ok) {
      throw new Error(`Nutrition refresh failed (${response.status})`);
    }
  },
};
