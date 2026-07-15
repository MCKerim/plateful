import { describe, expect, it } from "vitest";
import { filterRecipesByCollection } from "./collectionFiltering";
import type { CookbookRecipe } from "@/types/cookbook.types";

function recipe(id: string, collectionIds: string[]): CookbookRecipe {
  return {
    id,
    recipeName: id,
    description: "",
    collectionIds,
    created_at: "2026-01-01T00:00:00Z",
    status: "ready",
    avg_rating: null,
  };
}

describe("filterRecipesByCollection", () => {
  const assigned = recipe("assigned", ["collection-a", "collection-b"]);
  const unassigned = recipe("unassigned", []);

  it("keeps assigned and unassigned recipes in All Recipes", () => {
    expect(filterRecipesByCollection([assigned, unassigned], "all")).toEqual([
      assigned,
      unassigned,
    ]);
  });

  it("filters using membership IDs", () => {
    expect(filterRecipesByCollection([assigned, unassigned], "collection-b")).toEqual([
      assigned,
    ]);
  });
});
