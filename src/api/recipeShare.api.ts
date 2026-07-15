import type { SupabaseClient } from "@supabase/supabase-js";
import type { SharedRecipeSnapshot, SharedRecipeRow } from "@/types/recipeShare.types";
import { parseInstructionsMarkdown } from "@/lib/transformers/instruction.transformer";

// 10 years in seconds — effectively permanent for share snapshots
const SHARE_IMAGE_EXPIRY_SECONDS = 315_360_000;

export const recipeShareApi = {
  /**
   * Create a shared recipe snapshot in the DB and return the generated token.
   * Caller is responsible for building the snapshot (name, ingredients, etc.).
   * Images are copied into a dedicated `shared_<uuid>/` folder so the snapshot
   * is unaffected if the owner later deletes or replaces the original image.
   */
  async create(
    supabase: SupabaseClient,
    snapshot: Omit<SharedRecipeSnapshot, "image_urls" | "image_folder"> & { image_paths: string[] }
  ): Promise<string> {
    // Copy each image into a share-owned folder, then sign the copy.
    // This ensures the shared view is never affected by changes to the original.
    const imageFolder = `shared_${crypto.randomUUID()}`;

    const imageUrls = (
      await Promise.all(
        snapshot.image_paths.map(async (srcPath) => {
          const filename = srcPath.split("/").pop()!;
          const destPath = `${imageFolder}/${filename}`;

          const { error: copyError } = await supabase.storage
            .from("recipeimages")
            .copy(srcPath, destPath);

          if (copyError) return null;

          const { data } = await supabase.storage
            .from("recipeimages")
            .createSignedUrl(destPath, SHARE_IMAGE_EXPIRY_SECONDS);

          return data?.signedUrl ?? null;
        })
      )
    ).filter((url): url is string => url !== null);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image_paths: _imagePaths, ...snapshotFields } = snapshot;
    const fullSnapshot: SharedRecipeSnapshot = {
      ...snapshotFields,
      image_urls: imageUrls,
      image_folder: imageFolder,
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
   * Delete a share by token. Removes the snapshot-owned image copies from
   * storage (if present) and then deletes the DB row.
   */
  async deleteByToken(supabase: SupabaseClient, token: string): Promise<void> {
    const share = await recipeShareApi.getByToken(supabase, token);
    if (!share) return;

    const { image_folder } = share.snapshot;

    const { data: files } = await supabase.storage
      .from("recipeimages")
      .list(image_folder);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${image_folder}/${f.name}`);
      await supabase.storage.from("recipeimages").remove(paths);
    }

    const { error } = await supabase
      .from("shared_recipes")
      .delete()
      .eq("token", token);

    if (error) throw error;
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
        base_servings: snapshot.base_servings ?? null,
        servings_unit: snapshot.servings_unit ?? null,
        household_id: householdId,
        owner_id: authData.user.id,
        link: snapshot.link ?? null,
      })
      .select("id")
      .single();

    if (recipeError) throw recipeError;
    const newRecipeId = recipe.id;

    // 2+3. Insert ingredients and copy images in parallel
    const ingredientInsert = snapshot.ingredients.length > 0
      ? supabase.from("recipe_ingredients").insert(
          snapshot.ingredients.map((ing) => ({
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
          }))
        ).then(({ error }) => { if (error) throw error; })
      : Promise.resolve();

    // Structured steps when the snapshot carries them; otherwise parse the
    // legacy markdown so even an old share imports as step rows.
    const steps =
      snapshot.instruction_steps && snapshot.instruction_steps.length > 0
        ? snapshot.instruction_steps.map((step, index) => ({
            stepText: step.step_text,
            groupName: step.group_name,
            sortOrder: index,
          }))
        : parseInstructionsMarkdown(snapshot.instructions ?? "");
    const instructionInsert = steps.length > 0
      ? supabase.from("recipe_instructions").insert(
          steps.map((step, index) => ({
            recipe_id: newRecipeId,
            step_text: step.stepText,
            group_name: step.groupName ?? null,
            sort_order: step.sortOrder ?? index,
          }))
        ).then(({ error }) => { if (error) throw error; })
      : Promise.resolve();

    const imageCopy = Promise.allSettled(
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

    await Promise.all([ingredientInsert, instructionInsert, imageCopy]);

    return newRecipeId;
  },
};
