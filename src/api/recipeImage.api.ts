import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "recipeimages";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function buildRecipeImagePath(recipeId: string, fileId = crypto.randomUUID()): string {
  if (!UUID_RE.test(recipeId) || !UUID_RE.test(fileId)) {
    throw new Error("Invalid recipe image identifier");
  }
  return `recipe_${recipeId.toLowerCase()}/${fileId.toLowerCase()}.jpg`;
}

/**
 * Allows image requests only to this app's exact Supabase project and recipe
 * bucket. Current public URLs and legacy signed URLs are supported.
 */
export function isTrustedRecipeImageUrl(
  rawUrl: string,
  projectUrl: string = import.meta.env.VITE_SUPABASE_URL
): boolean {
  try {
    const url = new URL(rawUrl);
    const project = new URL(projectUrl);
    if (
      url.protocol !== "https:" ||
      url.origin !== project.origin ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return false;
    }

    const prefixes = [`/storage/v1/object/public/${BUCKET}/`, `/storage/v1/object/sign/${BUCKET}/`];
    return prefixes.some(
      (prefix) => url.pathname.startsWith(prefix) && url.pathname.length > prefix.length
    );
  } catch {
    return false;
  }
}

export const recipeImageApi = {
  /**
   * Uploads a new immutable JPEG, then commits it as the recipe's cover.
   * Database triggers queue the former cover only after this update commits.
   */
  async uploadCover(supabase: SupabaseClient, recipeId: string, image: File): Promise<string> {
    if (image.type !== "image/jpeg" || image.size > MAX_UPLOAD_BYTES) {
      throw new Error("Recipe photos must be JPEG images no larger than 5 MB");
    }

    const path = buildRecipeImagePath(recipeId);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, image, {
      cacheControl: "31536000",
      contentType: "image/jpeg",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error: updateError } = await supabase
      .from("recipes")
      .update({ image_path: path })
      .eq("id", recipeId)
      .select("image_path")
      .single();
    if (updateError) throw updateError;
    if (data?.image_path !== path) {
      throw new Error("Recipe photo reference was not saved");
    }

    return path;
  },

  /**
   * Clears the database reference first. Server-side cleanup removes the old
   * object asynchronously and retries without risking a broken recipe cover.
   */
  async clearCover(supabase: SupabaseClient, recipeId: string): Promise<void> {
    const { data, error } = await supabase
      .from("recipes")
      .update({ image_path: null })
      .eq("id", recipeId)
      .select("id")
      .single();
    if (error) throw error;
    if (!data) throw new Error("Recipe photo reference was not cleared");
  },
};
