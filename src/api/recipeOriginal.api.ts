import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRecipeOriginal, type RecipeOriginal } from "@/lib/recipeOriginal";

const RESET_ENDPOINT = "https://extractor.plateful.cloud/api/originals/reset";

export const recipeOriginalApi = {
  /** RLS lets the row through only behind a recipe of the caller's household. */
  async getById(supabase: SupabaseClient, originalId: string): Promise<RecipeOriginal> {
    const { data, error } = await supabase
      .from("recipe_originals")
      .select("id, snapshot, translations")
      .eq("id", originalId)
      .single();

    if (error) throw error;
    const original = parseRecipeOriginal(data);
    if (!original) throw new Error("Recipe original has an unknown snapshot shape");
    return original;
  },

  /**
   * Asks the recipe-extractor to put the recipe back to its original
   * (`POST /api/originals/reset`, the user's JWT, household check on the
   * server). Synchronous: when it answers, name, description, servings,
   * ingredients, steps, cover and nutrition are rewritten in the import's
   * language, and annotations and enrichment are queued. 404 `no_original`
   * when the recipe has none. The 60 s timeout covers a first translation.
   * Mirrors the iOS `RecipeOriginals.reset`.
   */
  async reset(supabase: SupabaseClient, recipeId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(RESET_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw new Error(`Reset to original failed (${response.status})`);
    }
  },
};
