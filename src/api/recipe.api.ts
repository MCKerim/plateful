import { SupabaseClient } from "@supabase/supabase-js";
import { Recipes } from "@/types/exportedDatabaseTypes.types";

export type CreateRecipeParams = {
  name: string;
  description?: string | null;
  instructions?: string | null;
  link: string;
  category: number;
  householdId: string;
  baseServings?: number | null;
};

export type UpdateRecipeParams = {
  recipeId: string;
  name: string;
  description?: string | null;
  instructions?: string | null;
  link: string;
  category: number;
  baseServings?: number | null;
};

export type RecipeImageInfo = {
  signedUrl: string;
  path: string;
};

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export const recipeApi = {
  async getById(supabase: SupabaseClient, recipeId: string): Promise<Recipes | null> {
    const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

    if (error) throw error;
    return data;
  },

  async getFirstImage(supabase: SupabaseClient, recipeId: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from("recipeimages").list(`recipe_${recipeId}/`);

    if (error || !data || data.length === 0) return null;

    const { data: signedUrlData } = await supabase.storage
      .from("recipeimages")
      .createSignedUrl(`recipe_${recipeId}/${data[0].name}`, SIGNED_URL_EXPIRY_SECONDS);

    return signedUrlData?.signedUrl ?? null;
  },

  async getImages(supabase: SupabaseClient, recipeId: string): Promise<string[]> {
    const { data, error } = await supabase.storage.from("recipeimages").list(`recipe_${recipeId}/`);

    if (error || !data) return [];

    const urls = await Promise.all(
      data.map(async (file) => {
        const { data: signedUrlData } = await supabase.storage
          .from("recipeimages")
          .createSignedUrl(`recipe_${recipeId}/${file.name}`, SIGNED_URL_EXPIRY_SECONDS);
        return signedUrlData?.signedUrl ?? null;
      })
    );

    return urls.filter((url): url is string => url !== null);
  },

  async getImageWithPath(
    supabase: SupabaseClient,
    recipeId: string
  ): Promise<RecipeImageInfo | null> {
    const { data, error } = await supabase.storage.from("recipeimages").list(`recipe_${recipeId}/`);

    if (error || !data || data.length === 0) return null;

    const path = `recipe_${recipeId}/${data[0].name}`;
    const { data: signedUrlData } = await supabase.storage
      .from("recipeimages")
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    return signedUrlData?.signedUrl ? { signedUrl: signedUrlData.signedUrl, path } : null;
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
          category: params.category,
          household_id: params.householdId,
          base_servings: params.baseServings,
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
        category: params.category,
        base_servings: params.baseServings,
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
    // Delete all images from storage first
    const { data: files } = await supabase.storage.from("recipeimages").list(`recipe_${recipeId}/`);

    if (files && files.length > 0) {
      const paths = files.map((file) => `recipe_${recipeId}/${file.name}`);
      await supabase.storage.from("recipeimages").remove(paths);
    }

    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

    if (error) throw error;
  },
};
