import { SupabaseClient } from "@supabase/supabase-js";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

export class RatingService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Fetch all ratings for a specific recipe
   */
  async getRatingsByRecipeId(
    recipeId: number
  ): Promise<RecipeRatingWithUser[]> {
    const { data, error } = await this.supabase
      .from("recipe_ratings")
      .select("*, users(created_at, email, username)")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      throw new Error("Failed to fetch ratings");
    }

    return data || [];
  }

  /**
   * Create a new rating
   */
  async createRating(
    recipeId: number,
    stars: number,
    note: string
  ): Promise<RecipeRatingWithUser> {
    const { data, error } = await this.supabase
      .from("recipe_ratings")
      .insert([{ recipe_id: recipeId, stars, note }])
      .select("*, users(created_at, email, username)")
      .single();

    if (error) {
      console.error("Error creating rating:", error);
      throw new Error("Failed to create rating");
    }

    return data;
  }

  /**
   * Update an existing rating
   */
  async updateRating(
    ratingId: number,
    stars: number,
    note: string
  ): Promise<RecipeRatingWithUser> {
    const { data, error } = await this.supabase
      .from("recipe_ratings")
      .update({ stars, note })
      .eq("id", ratingId)
      .select("*, users(created_at, email, username)")
      .single();

    if (error) {
      console.error("Error updating rating:", error);
      throw new Error("Failed to update rating");
    }

    return data;
  }

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: number): Promise<void> {
    const { error } = await this.supabase
      .from("recipe_ratings")
      .delete()
      .eq("id", ratingId);

    if (error) {
      console.error("Error deleting rating:", error);
      throw new Error("Failed to delete rating");
    }
  }

  /**
   * Calculate average rating from ratings array
   */
  static calculateAverage(ratings: RecipeRatingWithUser[]): number | null {
    if (ratings.length === 0) return null;

    const totalStars = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    return totalStars / ratings.length;
  }
}
