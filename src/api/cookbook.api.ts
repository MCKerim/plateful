import { SupabaseClient } from "@supabase/supabase-js";
import { CookbookRecipeRaw } from "@/types/cookbook.types";

export const cookbookApi = {
  async getRecipesWithRatings(supabase: SupabaseClient): Promise<CookbookRecipeRaw[]> {
    const { data, error } = await supabase.from("recipes").select(`
        id,
        name,
        description,
        created_at,
        status,
        recipe_ratings(stars),
        recipe_collections(collection_id)
      `);

    if (error) throw error;
    return (data as CookbookRecipeRaw[]) ?? [];
  },
};
