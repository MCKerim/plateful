export type RecipeStatus = "importing" | "ready";

export type CookbookRecipeRaw = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  status: string;
  image_path: string | null;
  recipe_ratings: { stars: number }[];
  recipe_collections: { collection_id: string }[];
};

export type CookbookRecipe = {
  id: string;
  recipeName: string;
  description: string;
  collectionIds: string[];
  created_at: string;
  status: RecipeStatus;
  avg_rating: number | null;
  /**
   * The cover's public URL, null while the recipe has none. It comes with the
   * list so that a card never asks for it on its own (454 cards once did,
   * docs/knowledge/supabase-connection-limit.md).
   */
  imageUrl: string | null;
};
