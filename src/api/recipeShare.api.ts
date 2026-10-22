import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedRecipeShare, SharedRecipeSnapshot } from "@/types/recipeShare.types";

export const recipeShareApi = {
  /**
   * Create a shared recipe snapshot in the DB and return the generated token.
   * Caller builds the textual snapshot. The Edge Function verifies household
   * access, reads the recipe's authoritative cover path, and copies it with the
   * service role, so clients never receive Storage list/copy permission. It
   * also stamps the recipe's `original_id` into the snapshot.
   */
  async create(
    supabase: SupabaseClient,
    recipeId: string,
    snapshot: Omit<SharedRecipeSnapshot, "image_urls" | "image_folder">
  ): Promise<string> {
    const { data, error } = await supabase.functions.invoke("create-recipe-share", {
      body: { recipe_id: recipeId, snapshot },
    });
    if (error) throw error;
    if (!data || typeof data.token !== "string") {
      throw new Error("Share service returned an invalid response");
    }
    return data.token;
  },

  /**
   * Resolve one shared recipe by its capability token. No auth is required,
   * but the backing table is not exposed through this read path.
   */
  async getByToken(supabase: SupabaseClient, token: string): Promise<ResolvedRecipeShare | null> {
    const { data, error } = await supabase.rpc("resolve_recipe_share", {
      p_token: token,
    });

    if (error) throw error;

    const row = data?.[0];
    if (!row) return null;

    return {
      snapshot: row.snapshot as unknown as SharedRecipeSnapshot,
    };
  },

  /**
   * Delete a share by token. The committed row deletion queues its image folder
   * for retryable server-side cleanup.
   */
  async deleteByToken(supabase: SupabaseClient, token: string): Promise<void> {
    const { error } = await supabase.from("shared_recipes").delete().eq("token", token);

    if (error) throw error;
  },
};
