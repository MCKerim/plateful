import { SupabaseClient } from "@supabase/supabase-js";
import { Recipes } from "@/types/exportedDatabaseTypes.types";
import { NutritionValues } from "@/api/nutrition.api";

export type CreateRecipeParams = {
  name: string;
  description?: string | null;
  instructions?: string | null;
  link: string;
  householdId: string;
  baseServings?: number | null;
  /** When provided, writes all 7 metrics (a null value clears that column). */
  nutrition?: NutritionValues | null;
};

export type UpdateRecipeParams = {
  recipeId: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  link: string;
  baseServings?: number | null;
  /** When provided, writes all 7 metrics (a null value clears that column). */
  nutrition?: NutritionValues | null;
};

export type RecipeImageInfo = {
  /** Public URL of the recipe's cover image (the bucket is public). */
  signedUrl: string;
  path: string;
};

/** All-null nutrition, used to explicitly clear every column on update. */
const emptyNutrition: NutritionValues = {
  calories_kcal: null,
  carbs_g: null,
  protein_g: null,
  fat_g: null,
  sugar_g: null,
  fiber_g: null,
  sodium_mg: null,
};

export const recipeApi = {
  async getById(supabase: SupabaseClient, recipeId: string): Promise<Recipes | null> {
    const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

    if (error) throw error;
    return data;
  },

  async getFirstImage(supabase: SupabaseClient, recipeId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("recipes")
      .select("image_path")
      .eq("id", recipeId)
      .single();

    if (error || !data?.image_path) return null;

    return supabase.storage.from("recipeimages").getPublicUrl(data.image_path).data.publicUrl;
  },

  // One cover image per recipe now, so this returns the cover (or nothing).
  async getImages(supabase: SupabaseClient, recipeId: string): Promise<string[]> {
    const url = await recipeApi.getFirstImage(supabase, recipeId);
    return url ? [url] : [];
  },

  async getImageWithPath(
    supabase: SupabaseClient,
    recipeId: string
  ): Promise<RecipeImageInfo | null> {
    const { data, error } = await supabase
      .from("recipes")
      .select("image_path")
      .eq("id", recipeId)
      .single();

    if (error || !data?.image_path) return null;

    const url = supabase.storage.from("recipeimages").getPublicUrl(data.image_path).data.publicUrl;
    return { signedUrl: url, path: data.image_path };
  },

  async create(supabase: SupabaseClient, params: CreateRecipeParams): Promise<Recipes> {
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          name: params.name,
          description: params.description ?? null,
          instructions: params.instructions ?? null,
          link: params.link,
          household_id: params.householdId,
          base_servings: params.baseServings,
          ...(params.nutrition ? params.nutrition : {}),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(supabase: SupabaseClient, params: UpdateRecipeParams): Promise<Recipes> {
    const { data, error } = await supabase
      .from("recipes")
      .update({
        name: params.name,
        description: params.description ?? null,
        instructions: params.instructions ?? null,
        link: params.link,
        base_servings: params.baseServings,
        // Only touch nutrition columns when the editor supplied them, so other
        // update paths never accidentally wipe a saved estimate.
        ...(params.nutrition !== undefined ? (params.nutrition ?? emptyNutrition) : {}),
      })
      .eq("id", params.recipeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBaseServings(
    supabase: SupabaseClient,
    recipeId: string,
    baseServings: number
  ): Promise<void> {
    const { error } = await supabase
      .from("recipes")
      .update({ base_servings: baseServings })
      .eq("id", recipeId);

    if (error) throw error;
  },

  async delete(supabase: SupabaseClient, recipeId: string): Promise<void> {
    // The database trigger queues the Storage folder after this delete commits.
    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

    if (error) throw error;
  },
};
