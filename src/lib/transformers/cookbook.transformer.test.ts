import { describe, expect, it } from "vitest";
import { transformCookbookRecipes } from "./cookbook.transformer";
import type { CookbookRecipeRaw } from "@/types/cookbook.types";

const baseRecipe: CookbookRecipeRaw = {
  id: "recipe-1",
  name: "Soup",
  description: null,
  created_at: "2026-01-01T00:00:00Z",
  status: "ready",
  image_path: null,
  recipe_ratings: [],
  recipe_collections: [],
};

const noUrl = () => null;

describe("transformCookbookRecipes", () => {
  it("returns no collection IDs for an unassigned recipe", () => {
    expect(transformCookbookRecipes([baseRecipe], noUrl)[0].collectionIds).toEqual([]);
  });

  it("returns every collection membership", () => {
    const recipe = {
      ...baseRecipe,
      recipe_collections: [{ collection_id: "one" }, { collection_id: "two" }],
    };

    expect(transformCookbookRecipes([recipe], noUrl)[0].collectionIds).toEqual(["one", "two"]);
  });

  it("turns the cover path into its URL and leaves a recipe without one empty", () => {
    const withCover = { ...baseRecipe, id: "recipe-2", image_path: "recipe_2/cover.jpeg" };

    const [plain, covered] = transformCookbookRecipes([baseRecipe, withCover], (path) =>
      path === null ? null : `https://cdn.test/${path}`
    );

    expect(plain.imageUrl).toBeNull();
    expect(covered.imageUrl).toBe("https://cdn.test/recipe_2/cover.jpeg");
  });
});
