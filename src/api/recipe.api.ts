import { SupabaseClient } from "@supabase/supabase-js";
import { Recipes } from "@/types/exportedDatabaseTypes.types";

export type CreateRecipeParams = {
  name: string;
  description: string;
  link: string;
  category: number;
  householdId: number;
};

export type UpdateRecipeParams = {
  recipeId: number;
  name: string;
  description: string;
  link: string;
  category: number;
};

export type RecipeImageInfo = {
  signedUrl: string;
  path: string;
};

export const recipeApi = {
  async getById(
    supabase: SupabaseClient,
    recipeId: number
  ): Promise<Recipes | null> {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (error) throw error;
    return data;
  },

  async getImages(
    supabase: SupabaseClient,
    recipeId: number
  ): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from("recipeimages")
      .list(`recipe_${recipeId}/`);

    if (error || !data) return [];

    const urls = await Promise.all(
      data.map(async (file) => {
        const { data: signedUrlData } = await supabase.storage
          .from("recipeimages")
          .createSignedUrl(`recipe_${recipeId}/${file.name}`, 3600);
        return signedUrlData?.signedUrl ?? null;
      })
    );

    return urls.filter((url): url is string => url !== null);
  },

  async getImageWithPath(
    supabase: SupabaseClient,
    recipeId: number
  ): Promise<RecipeImageInfo | null> {
    const { data, error } = await supabase.storage
      .from("recipeimages")
      .list(`recipe_${recipeId}/`);

    if (error || !data || data.length === 0) return null;

    const path = `recipe_${recipeId}/${data[0].name}`;
    const { data: signedUrlData } = await supabase.storage
      .from("recipeimages")
      .createSignedUrl(path, 3600);

    return signedUrlData?.signedUrl
      ? { signedUrl: signedUrlData.signedUrl, path }
      : null;
  },

  async create(
    supabase: SupabaseClient,
    params: CreateRecipeParams
  ): Promise<Recipes> {
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          name: params.name,
          description: params.description,
          link: params.link,
          category: params.category,
          household_id: params.householdId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    supabase: SupabaseClient,
    params: UpdateRecipeParams
  ): Promise<Recipes> {
    const { data, error } = await supabase
      .from("recipes")
      .update({
        name: params.name,
        description: params.description,
        link: params.link,
        category: params.category,
      })
      .eq("id", params.recipeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(supabase: SupabaseClient, recipeId: number): Promise<void> {
    // Delete all images from storage first
    const { data: files } = await supabase.storage
      .from("recipeimages")
      .list(`recipe_${recipeId}/`);

    if (files && files.length > 0) {
      const paths = files.map((file) => `recipe_${recipeId}/${file.name}`);
      await supabase.storage.from("recipeimages").remove(paths);
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) throw error;
  },
};
