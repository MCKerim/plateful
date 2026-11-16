import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { ShoppingAisle } from "@/lib/shopping-list/aisle";
import type { Amount, ShoppingListItemRow, TypedLine } from "@/lib/shopping-list/item";

type Client = SupabaseClient<Database>;

/** Optional RPC parameters: an omitted one is null on the server. */
function amountParams(amount: Amount) {
  return {
    p_quantity_value: amount.quantityValue ?? undefined,
    p_quantity_display: amount.quantityDisplay ?? undefined,
    p_unit: amount.unit ?? undefined,
  };
}

// Every write is household-scoped by RLS; the RPCs are `security invoker`.
export const shoppingListApi = {
  /** The household's whole catalogue, on the list and off. */
  async getItems(supabase: Client, householdId: string): Promise<ShoppingListItemRow[]> {
    const { data, error } = await supabase
      .from("shopping_list_items")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at");
    if (error) throw error;
    return data ?? [];
  },

  /** Every product with all its spellings per language, the names the server matches on. */
  async getDictionary(supabase: Client) {
    const { data, error } = await supabase
      .from("ingredient_dictionary")
      .select("slug, name_en, name_de, category, is_staple, names_de, names_en, icon_path");
    if (error) throw error;
    return data ?? [];
  },

  /** Buying and putting back; the server's trigger stamps the purchase and the ledger. */
  async setOnList(supabase: Client, id: string, onList: boolean): Promise<void> {
    const { error } = await supabase
      .from("shopping_list_items")
      .update({ on_list: onList })
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * One typed line. The id is minted by the client, so a retry cannot add a
   * second row; the server matches the name against the dictionary (the app's
   * language first) and answers with the row, slug and aisle included.
   */
  async addItem(
    supabase: Client,
    params: { id: string; householdId: string; line: TypedLine; language: string }
  ): Promise<ShoppingListItemRow[]> {
    const { data, error } = await supabase.rpc("add_shopping_list_item", {
      p_id: params.id,
      p_household_id: params.householdId,
      p_name: params.line.name,
      ...amountParams(params.line),
      p_language: params.language,
    });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Recipe ingredient rows onto the list, each at its own scale; the rows may
   * span recipes (the planner's week). The server merges every line into the
   * household's items and answers with the rows it touched.
   */
  async addIngredients(
    supabase: Client,
    householdId: string,
    lines: { ingredientId: string; scale: number }[]
  ): Promise<ShoppingListItemRow[]> {
    const { data, error } = await supabase.rpc("add_ingredients_to_shopping_list", {
      p_household_id: householdId,
      p_lines: lines.map((line) => ({ ingredient_id: line.ingredientId, scale: line.scale })),
    });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * The edit sheet: name, aisle and the amount as it should be stored. A changed
   * spelling marks the title as the household's own (`name_custom`), and a new
   * name is matched against the dictionary in the app's language first.
   */
  async updateItem(
    supabase: Client,
    params: { id: string; name: string; aisle: ShoppingAisle; amount: Amount; language: string }
  ): Promise<ShoppingListItemRow[]> {
    const { data, error } = await supabase.rpc("update_shopping_list_item", {
      p_id: params.id,
      p_name: params.name,
      p_category: params.aisle,
      ...amountParams(params.amount),
      p_language: params.language,
    });
    if (error) throw error;
    return data ?? [];
  },

  /** The shopper's own words; a plain update, the household's update policy covers it. */
  async setNote(supabase: Client, id: string, note: string | null): Promise<void> {
    const { error } = await supabase.from("shopping_list_items").update({ note }).eq("id", id);
    if (error) throw error;
  },

  /** Replays the ledger without the recipe's lines; returns the rows it kept. */
  async removeRecipe(
    supabase: Client,
    householdId: string,
    recipeId: string
  ): Promise<ShoppingListItemRow[]> {
    const { data, error } = await supabase.rpc("remove_recipe_from_shopping_list", {
      p_household_id: householdId,
      p_recipe_id: recipeId,
    });
    if (error) throw error;
    return data ?? [];
  },

  /** Deletes an item for good, its memory included. */
  async deleteItem(supabase: Client, id: string): Promise<void> {
    const { error } = await supabase.from("shopping_list_items").delete().eq("id", id);
    if (error) throw error;
  },
};
