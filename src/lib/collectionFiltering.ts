import type { CookbookRecipe } from "@/types/cookbook.types";
import type { CollectionSelection } from "@/redux/slices/filterAndSortingSlice";

export function filterRecipesByCollection(
  recipes: CookbookRecipe[],
  selection: CollectionSelection
): CookbookRecipe[] {
  if (!selection || selection === "all") return recipes;
  return recipes.filter((recipe) => recipe.collectionIds.includes(selection));
}
