export type CookbookRecipeRaw = {
  id: number;
  name: string;
  description: string | null;
  category: number | null;
  created_at: string;
  recipe_ratings: { stars: number }[];
};

export type CookbookRecipe = {
  id: number;
  recipeName: string;
  description: string;
  category: number | null;
  created_at: string;
  avg_rating: number | null;
};
