import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type {
  RecipeIngredientRow,
  RecipeIngredientInput,
  RecipeIngredientInsert,
} from "@/types/ingredient.types";
import { parseIngredient } from "@/lib/ingredient-parser/parse-ingredient";

type TypedSupabaseClient = SupabaseClient<Database>;

export const ingredientsApi = {
  /**
   * Get all ingredients for a recipe
   */
  async getByRecipeId(
    supabase: TypedSupabaseClient,
    recipeId: string
  ): Promise<RecipeIngredientRow[]> {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Create a single ingredient
   */
  async create(
    supabase: TypedSupabaseClient,
    recipeId: string,
    input: RecipeIngredientInput,
    sortOrder?: number
  ): Promise<RecipeIngredientRow> {
    const parsed = parseIngredient(input.rawText);

    const insertData: RecipeIngredientInsert = {
      recipe_id: recipeId,
      raw_text: input.rawText,
      quantity_value: parsed.quantityValue,
      quantity_display: parsed.quantityDisplay,
      unit: parsed.unit,
      unit_normalized: parsed.unitNormalized,
      ingredient_name: parsed.ingredientName,
      ingredient_name_normalized: parsed.ingredientNameNormalized,
      preparation_note: parsed.preparationNote,
      is_scalable: parsed.isScalable,
      is_optional: input.isOptional ?? false,
      group_name: input.groupName ?? null,
      sort_order: sortOrder ?? input.sortOrder ?? 0,
    };

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create multiple ingredients at once
   */
  async createBulk(
    supabase: TypedSupabaseClient,
    recipeId: string,
    inputs: RecipeIngredientInput[]
  ): Promise<RecipeIngredientRow[]> {
    const insertData: RecipeIngredientInsert[] = inputs.map((input, index) => {
      const parsed = parseIngredient(input.rawText);
      return {
        recipe_id: recipeId,
        raw_text: input.rawText,
        quantity_value: parsed.quantityValue,
        quantity_display: parsed.quantityDisplay,
        unit: parsed.unit,
        unit_normalized: parsed.unitNormalized,
        ingredient_name: parsed.ingredientName,
        ingredient_name_normalized: parsed.ingredientNameNormalized,
        preparation_note: parsed.preparationNote,
        is_scalable: parsed.isScalable,
        is_optional: input.isOptional ?? false,
        group_name: input.groupName ?? null,
        sort_order: input.sortOrder ?? index,
      };
    });

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .insert(insertData)
      .select();

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Update an ingredient
   */
  async update(
    supabase: TypedSupabaseClient,
    ingredientId: string,
    input: Partial<RecipeIngredientInput>
  ): Promise<RecipeIngredientRow> {
    const updateData: Partial<RecipeIngredientInsert> = {
      updated_at: new Date().toISOString(),
    };

    // If raw text is being updated, re-parse
    if (input.rawText !== undefined) {
      const parsed = parseIngredient(input.rawText);
      updateData.raw_text = input.rawText;
      updateData.quantity_value = parsed.quantityValue;
      updateData.quantity_display = parsed.quantityDisplay;
      updateData.unit = parsed.unit;
      updateData.unit_normalized = parsed.unitNormalized;
      updateData.ingredient_name = parsed.ingredientName;
      updateData.ingredient_name_normalized = parsed.ingredientNameNormalized;
      updateData.preparation_note = parsed.preparationNote;
      updateData.is_scalable = parsed.isScalable;
    }

    if (input.groupName !== undefined) {
      updateData.group_name = input.groupName;
    }

    if (input.sortOrder !== undefined) {
      updateData.sort_order = input.sortOrder;
    }

    if (input.isOptional !== undefined) {
      updateData.is_optional = input.isOptional;
    }

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .update(updateData)
      .eq("id", ingredientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an ingredient
   */
  async delete(
    supabase: TypedSupabaseClient,
    ingredientId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("id", ingredientId);

    if (error) throw error;
  },

  /**
   * Delete all ingredients for a recipe
   */
  async deleteAllForRecipe(
    supabase: TypedSupabaseClient,
    recipeId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);

    if (error) throw error;
  },

  /**
   * Reorder ingredients
   */
  async reorder(
    supabase: TypedSupabaseClient,
    orderedIds: string[]
  ): Promise<void> {
    // Update each ingredient's sort_order
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("recipe_ingredients")
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
    );

    await Promise.all(updates);
  },

  /**
   * Replace all ingredients for a recipe
   * Useful when user edits all ingredients at once
   */
  async replaceAll(
    supabase: TypedSupabaseClient,
    recipeId: string,
    inputs: RecipeIngredientInput[]
  ): Promise<RecipeIngredientRow[]> {
    // Delete existing ingredients
    await ingredientsApi.deleteAllForRecipe(supabase, recipeId);

    // If no new ingredients, return empty
    if (inputs.length === 0) {
      return [];
    }

    // Create new ingredients
    return ingredientsApi.createBulk(supabase, recipeId, inputs);
  },
};
