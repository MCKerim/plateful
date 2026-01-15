import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function fetchRecipeImage(
  supabase: SupabaseClient<Database>,
  recipeId: number
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("recipeimages")
    .list(`recipe_${recipeId}/`);

  if (!error && data && data.length > 0) {
    const { data: signedUrlData } = await supabase.storage
      .from("recipeimages")
      .createSignedUrl(`recipe_${recipeId}/${data[0].name}`, 3600);

    return signedUrlData?.signedUrl || null;
  }
  return null;
}

export async function fetchRecipeLastPlanned(
  supabase: SupabaseClient<Database>,
  recipeId: number
) {
  const { data } = await supabase
    .from("meal_planning")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return data[0];
  }

  return null;
}
