import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RecipeCollection } from "@/types/exportedDatabaseTypes.types";
import type { CollectionColorKey } from "@/lib/collectionColorPalette";

type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];

export type CreateCollectionParams = {
  householdId: string;
  name: string;
  colorKey: CollectionColorKey;
};

export type UpdateCollectionParams = {
  collectionId: string;
  name: string;
  colorKey: CollectionColorKey;
};

export function isDuplicateCollectionNameError(error: unknown): boolean {
  return (error as Partial<PostgrestError> | null)?.code === "23505";
}

export const collectionApi = {
  async list(
    supabase: SupabaseClient<Database>,
    householdId: string
  ): Promise<RecipeCollection[]> {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async create(
    supabase: SupabaseClient<Database>,
    params: CreateCollectionParams
  ): Promise<RecipeCollection> {
    // A deployed compatibility trigger mirrors color_key into color_hex. The
    // generated type cannot see that trigger, so it still marks color_hex as
    // required even though new clients must never write it.
    const payload = {
      household_id: params.householdId,
      name: params.name.trim(),
      color_key: params.colorKey,
    } as CollectionInsert;

    const { data, error } = await supabase.from("collections").insert(payload).select().single();

    if (error) throw error;
    return data;
  },

  async update(
    supabase: SupabaseClient<Database>,
    params: UpdateCollectionParams
  ): Promise<RecipeCollection> {
    const { data, error } = await supabase
      .from("collections")
      .update({ name: params.name.trim(), color_key: params.colorKey })
      .eq("id", params.collectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(supabase: SupabaseClient<Database>, collectionId: string): Promise<void> {
    const { error } = await supabase.from("collections").delete().eq("id", collectionId);
    if (error) throw error;
  },

  async getRecipeMembershipIds(
    supabase: SupabaseClient<Database>,
    recipeId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from("recipe_collections")
      .select("collection_id")
      .eq("recipe_id", recipeId);

    if (error) throw error;
    return data?.map((membership) => membership.collection_id) ?? [];
  },

  async replaceRecipeMemberships(
    supabase: SupabaseClient<Database>,
    recipeId: string,
    collectionIds: string[]
  ): Promise<void> {
    const { error } = await supabase.rpc("replace_recipe_collections", {
      p_recipe_id: recipeId,
      p_collection_ids: collectionIds,
    });

    if (error) throw error;
  },
};
