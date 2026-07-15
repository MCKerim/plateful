import { describe, expect, it } from "vitest";
import { transformCookbookRecipes } from "./cookbook.transformer";
import type { CookbookRecipeRaw } from "@/types/cookbook.types";

const baseRecipe: CookbookRecipeRaw = {
  id: "recipe-1",
  name: "Soup",
  description: null,
  created_at: "2026-01-01T00:00:00Z",
  status: "ready",
  recipe_ratings: [],
  recipe_collections: [],
};

describe("transformCookbookRecipes", () => {
  it("returns no collection IDs for an unassigned recipe", () => {
    expect(transformCookbookRecipes([baseRecipe])[0].collectionIds).toEqual([]);
  });

  it("returns every collection membership", () => {
    const recipe = {
      ...baseRecipe,
      recipe_collections: [{ collection_id: "one" }, { collection_id: "two" }],
    };

    expect(transformCookbookRecipes([recipe])[0].collectionIds).toEqual(["one", "two"]);
  });
});
