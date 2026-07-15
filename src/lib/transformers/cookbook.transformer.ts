import {
  CookbookRecipeRaw,
  CookbookRecipe,
  RecipeStatus,
} from "@/types/cookbook.types";

export function transformCookbookRecipes(
  raw: CookbookRecipeRaw[]
): CookbookRecipe[] {
  return raw.map((recipe) => ({
    id: recipe.id,
    recipeName: recipe.name,
    description: recipe.description ?? "",
    collectionIds: recipe.recipe_collections?.map((membership) => membership.collection_id) ?? [],
    created_at: recipe.created_at,
    status: (recipe.status as RecipeStatus) ?? "ready",
    avg_rating:
      recipe.recipe_ratings.length > 0
        ? recipe.recipe_ratings.reduce((sum, rating) => sum + rating.stars, 0) /
          recipe.recipe_ratings.length
        : null,
  }));
}
