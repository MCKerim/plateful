export type RecipeStatus = "importing" | "ready";

export type CookbookRecipeRaw = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  status: string;
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
};
