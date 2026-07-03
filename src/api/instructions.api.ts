import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  RecipeInstructionInput,
  RecipeInstructionInsert,
  RecipeInstructionRow,
} from "@/types/instruction.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export const instructionsApi = {
  /**
   * Get all instruction steps for a recipe, in display order
   */
  async getByRecipeId(
    supabase: TypedSupabaseClient,
    recipeId: string
  ): Promise<RecipeInstructionRow[]> {
    const { data, error } = await supabase
      .from("recipe_instructions")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Replace all instruction steps for a recipe (delete-all + bulk insert —
   * mirrors ingredientsApi.replaceAll). An empty `inputs` just clears them.
   */
  async replaceAll(
    supabase: TypedSupabaseClient,
    recipeId: string,
    inputs: RecipeInstructionInput[]
  ): Promise<void> {
    const { error: deleteError } = await supabase
      .from("recipe_instructions")
      .delete()
      .eq("recipe_id", recipeId);
    if (deleteError) throw deleteError;

    if (inputs.length === 0) return;

    const rows: RecipeInstructionInsert[] = inputs.map((input, index) => ({
      recipe_id: recipeId,
      step_text: input.stepText,
      group_name: input.groupName ?? null,
      sort_order: input.sortOrder ?? index,
    }));
    const { error } = await supabase.from("recipe_instructions").insert(rows);
    if (error) throw error;
  },
};
