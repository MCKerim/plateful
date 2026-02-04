import { SupabaseClient } from "@supabase/supabase-js";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

export type CreateRatingParams = {
  recipeId: string;
  stars: number;
  note: string;
};

export type UpdateRatingParams = {
  ratingId: string;
  stars: number;
  note: string;
};

export const ratingsApi = {
  async getByRecipe(supabase: SupabaseClient, recipeId: string): Promise<RecipeRatingWithUser[]> {
    const { data, error } = await supabase
      .from("recipe_ratings")
      .select("*, users(created_at, email, username)")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async create(
    supabase: SupabaseClient,
    params: CreateRatingParams
  ): Promise<RecipeRatingWithUser> {
    const { data, error } = await supabase
      .from("recipe_ratings")
      .insert([{ recipe_id: params.recipeId, stars: params.stars, note: params.note }])
      .select("*, users(created_at, email, username)")
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    supabase: SupabaseClient,
    params: UpdateRatingParams
  ): Promise<RecipeRatingWithUser> {
    const { data, error } = await supabase
      .from("recipe_ratings")
      .update({ stars: params.stars, note: params.note })
      .eq("id", params.ratingId)
      .select("*, users(created_at, email, username)")
      .single();

    if (error) throw error;
    return data;
  },

  async delete(supabase: SupabaseClient, ratingId: string): Promise<void> {
    const { error } = await supabase.from("recipe_ratings").delete().eq("id", ratingId);

    if (error) throw error;
  },
};
