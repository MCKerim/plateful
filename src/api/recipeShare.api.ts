import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedRecipeShare, SharedRecipeSnapshot } from "@/types/recipeShare.types";
import { parseInstructionsMarkdown } from "@/lib/transformers/instruction.transformer";
import {
  snapshotNutrition,
  toStoredAnnotation,
} from "@/lib/transformers/recipeShare.transformer";
import { nutritionApi } from "@/api/nutrition.api";
import { reportError } from "@/utils/reportError";
import { isTrustedRecipeImageUrl, recipeImageApi } from "@/api/recipeImage.api";
import { IMAGE_COMPRESSION_OPTIONS } from "@/lib/constants";
import imageCompression from "browser-image-compression";

const MAX_SHARED_IMAGE_BYTES = 5 * 1024 * 1024;

async function downloadSharedImage(url: string): Promise<File> {
  if (!isTrustedRecipeImageUrl(url)) {
    throw new Error("Shared recipe photo URL is not trusted");
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error("Shared recipe photo could not be downloaded");
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Shared recipe photo has an invalid content type");
  }

  const declaredSize = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredSize) && declaredSize > MAX_SHARED_IMAGE_BYTES) {
    throw new Error("Shared recipe photo is too large");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_SHARED_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("Shared recipe photo is too large");
    }
    chunks.push(value);
  }

  const blob = new Blob(
    chunks.map((chunk) => chunk.slice().buffer),
    { type: contentType }
  );
  return new File([blob], "shared-recipe-photo", { type: contentType });
}

async function importFirstSharedImage(
  supabase: SupabaseClient,
  imageUrls: string[],
  recipeId: string
): Promise<void> {
  for (const url of imageUrls) {
    try {
      const downloaded = await downloadSharedImage(url);
      const compressed = await imageCompression(downloaded, IMAGE_COMPRESSION_OPTIONS);
      await recipeImageApi.uploadCover(supabase, recipeId, compressed);
      return;
    } catch {
      // An image is optional. Try the next legacy snapshot URL, then keep the
      // imported recipe usable without a cover if none succeeds.
    }
  }
}

export const recipeShareApi = {
  /**
   * Create a shared recipe snapshot in the DB and return the generated token.
   * Caller builds the textual snapshot. The Edge Function verifies household
   * access, reads the recipe's authoritative cover path, and copies it with the
   * service role, so clients never receive Storage list/copy permission.
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

  /**
   * Import a shared recipe into the current user's household.
   * Downloads each snapshot image and re-uploads it to the new recipe's storage path.
   *
   * What the snapshot carries is copied, not re-derived: the sharer's
   * nutrition values (and whether they were managed automatically) and the
   * steps' cooking-mode annotations. Only a snapshot without nutrition falls
   * back to asking the extractor for an estimate, the way a save does.
   */
  async importIntoHousehold(
    supabase: SupabaseClient,
    snapshot: SharedRecipeSnapshot,
    householdId: string
  ): Promise<string> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Must be logged in to import a recipe");

    const nutrition = snapshotNutrition(snapshot);
    const nutritionAuto = snapshot.nutrition_auto ?? true;

    // 1. Create the recipe record
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        name: snapshot.name,
        description: snapshot.description ?? null,
        instructions: snapshot.instructions ?? null,
        // `base_servings` is NOT NULL. Snapshots taken before 2026-08-11 can
        // carry a null, so fall back to 1 rather than sending the null on.
        base_servings: snapshot.base_servings ?? 1,
        servings_unit: snapshot.servings_unit ?? null,
        household_id: householdId,
        owner_id: authData.user.id,
        link: snapshot.link ?? null,
        ...(nutrition ?? {}),
        nutrition_auto: nutritionAuto,
      })
      .select("id")
      .single();

    if (recipeError) throw recipeError;
    const newRecipeId = recipe.id;

    // Minted here rather than by the database: the step annotations refer to
    // ingredients by snapshot position, and the row ids must be known to
    // write them (`ingredientIds[i]` is the row for `ingredients[i]`).
    const ingredientIds = snapshot.ingredients.map(() => crypto.randomUUID());

    // 2+3. Insert ingredients and copy images in parallel
    const ingredientInsert =
      snapshot.ingredients.length > 0
        ? supabase
            .from("recipe_ingredients")
            .insert(
              snapshot.ingredients.map((ing, index) => ({
                id: ingredientIds[index],
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
            )
            .then(({ error }) => {
              if (error) throw error;
            })
        : Promise.resolve();

    // Structured steps when the snapshot carries them — with the sharer's
    // cooking-mode annotations re-pointed at the rows minted above; otherwise
    // parse the legacy markdown so even an old share imports as step rows.
    const steps =
      snapshot.instruction_steps && snapshot.instruction_steps.length > 0
        ? snapshot.instruction_steps.map((step, index) => ({
            stepText: step.step_text,
            groupName: step.group_name,
            sortOrder: index,
            annotation: toStoredAnnotation(step.annotation, ingredientIds),
          }))
        : parseInstructionsMarkdown(snapshot.instructions ?? "").map((step) => ({
            ...step,
            annotation: null,
          }));
    const instructionInsert =
      steps.length > 0
        ? supabase
            .from("recipe_instructions")
            .insert(
              steps.map((step, index) => ({
                recipe_id: newRecipeId,
                step_text: step.stepText,
                group_name: step.groupName ?? null,
                sort_order: step.sortOrder ?? index,
                annotation: step.annotation,
              }))
            )
            .then(({ error }) => {
              if (error) throw error;
            })
        : Promise.resolve();

    const imageCopy = importFirstSharedImage(supabase, snapshot.image_urls, newRecipeId);

    await Promise.all([ingredientInsert, instructionInsert, imageCopy]);

    // No values came along (an older snapshot, or the sharer had none): ask
    // for the first estimate now that the ingredient rows exist — the same
    // best-effort call AddRecipe and the chatbot make. The values arrive via
    // Realtime; the server skips recipes whose automatic updates are off.
    if (!nutrition && nutritionAuto && snapshot.ingredients.length > 0) {
      nutritionApi.refresh(supabase, newRecipeId).catch((error) => {
        reportError("Shared recipe nutrition refresh request failed", error);
      });
    }

    return newRecipeId;
  },
};
