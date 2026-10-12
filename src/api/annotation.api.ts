import type { SupabaseClient } from "@supabase/supabase-js";

const ANNOTATE_ENDPOINT = "https://extractor.plateful.cloud/api/annotate";

export const annotationApi = {
  /**
   * Asks the recipe-extractor to (re)annotate a recipe's steps for the
   * cooking-mode chips (`POST /api/annotate`, the user's JWT, household
   * check on the server). Call it after a save that rebuilt the ingredient
   * and instruction rows: the delete and insert dropped the previous
   * annotations (they point at the old row ids and the exact text), so the
   * worker derives them again and bumps the recipe for the realtime refetch.
   * Background enhancement only: until it lands the steps render plain with
   * regex timer chips, which is correct, just unenhanced. Mirrors the iOS
   * `RecipeAnnotator`.
   */
  async request(supabase: SupabaseClient, recipeId: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(ANNOTATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (!response.ok) {
      throw new Error(`Annotation request failed (${response.status})`);
    }
  },
};
