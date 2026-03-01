import type { SupabaseClient } from "@supabase/supabase-js";
import type { SharedRecipeSnapshot, SharedRecipeRow } from "@/types/recipeShare.types";

// 10 years in seconds — effectively permanent for share snapshots
const SHARE_IMAGE_EXPIRY_SECONDS = 315_360_000;

export const recipeShareApi = {
  /**
   * Create a shared recipe snapshot in the DB and return the generated token.
   * Caller is responsible for building the snapshot (name, ingredients, etc.).
   * Images in the `recipeimages` bucket are signed here with a very long TTL
   * so unauthenticated viewers can load them without hitting auth.
   */
  async create(
    supabase: SupabaseClient,
    recipeId: string,
    snapshot: Omit<SharedRecipeSnapshot, "image_urls"> & { image_paths: string[] }
  ): Promise<string> {
    // Generate long-lived signed URLs for each image path
    const imageUrls = await Promise.all(
      snapshot.image_paths.map(async (path) => {
        const { data } = await supabase.storage
          .from("recipeimages")
          .createSignedUrl(path, SHARE_IMAGE_EXPIRY_SECONDS);
        return data?.signedUrl ?? null;
      })
    );

    const fullSnapshot: SharedRecipeSnapshot = {
      name: snapshot.name,
      description: snapshot.description,
      instructions: snapshot.instructions,
      category: snapshot.category,
      base_servings: snapshot.base_servings,
      servings_unit: snapshot.servings_unit,
      image_urls: imageUrls.filter((url): url is string => url !== null),
      ingredients: snapshot.ingredients,
    };

    const { data: authData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("shared_recipes")
      .insert({
        snapshot: fullSnapshot as unknown as Record<string, unknown>,
        created_by: authData.user?.id ?? null,
      })
      .select("token")
      .single();

    if (error) throw error;
    return data.token;
  },

  /**
   * Fetch a shared recipe by token. No auth required (public RLS policy).
   */
  async getByToken(
    supabase: SupabaseClient,
    token: string
  ): Promise<SharedRecipeRow | null> {
    const { data, error } = await supabase
      .from("shared_recipes")
      .select("*")
      .eq("token", token)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // not found
      throw error;
    }

    return data as unknown as SharedRecipeRow;
  },

  /**
   * List image paths for a recipe from storage (for snapshot creation).
   */
  async getImagePaths(supabase: SupabaseClient, recipeId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from("recipeimages")
      .list(`recipe_${recipeId}/`);

    if (error || !data) return [];
    return data.map((file) => `recipe_${recipeId}/${file.name}`);
  },

  /**
   * Import a shared recipe into the current user's household.
   * Downloads each snapshot image and re-uploads it to the new recipe's storage path.
   */
  async importIntoHousehold(
    supabase: SupabaseClient,
    snapshot: SharedRecipeSnapshot,
    householdId: string
  ): Promise<string> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Must be logged in to import a recipe");

    // 1. Create the recipe record
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        name: snapshot.name,
        description: snapshot.description ?? null,
        instructions: snapshot.instructions ?? null,
        category: snapshot.category ?? null,
        base_servings: snapshot.base_servings ?? null,
        servings_unit: snapshot.servings_unit ?? null,
        household_id: householdId,
        owner_id: authData.user.id,
        link: null,
      })
      .select("id")
      .single();

    if (recipeError) throw recipeError;
    const newRecipeId = recipe.id;

    // 2. Bulk insert ingredients
    if (snapshot.ingredients.length > 0) {
      const ingredientRows = snapshot.ingredients.map((ing) => ({
        recipe_id: newRecipeId,
        raw_text: ing.raw_text,
        quantity_value: ing.quantity_value,
        quantity_display: ing.quantity_display,
        unit: ing.unit,
        ingredient_name: ing.ingredient_name,
        group_name: ing.group_name,
        sort_order: ing.sort_order,
        is_scalable: ing.is_scalable,
        is_optional: ing.is_optional,
        preparation_note: ing.preparation_note,
      }));

      const { error: ingError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientRows);

      if (ingError) throw ingError;
    }

    // 3. Copy images: download from snapshot signed URLs and upload to new recipe storage
    await Promise.allSettled(
      snapshot.image_urls.map(async (url, index) => {
        try {
          const response = await fetch(url);
          if (!response.ok) return;

          const blob = await response.blob();
          const extension = blob.type.split("/")[1] ?? "jpg";
          const filename = `${Date.now()}_${index}.${extension}`;
          const path = `recipe_${newRecipeId}/${filename}`;

          await supabase.storage.from("recipeimages").upload(path, blob, {
            contentType: blob.type,
            upsert: false,
          });
        } catch {
          // Image copy failure is non-fatal — the recipe is still usable
        }
      })
    );

    return newRecipeId;
  },
};
