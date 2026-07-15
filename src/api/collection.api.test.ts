import { describe, expect, it, vi } from "vitest";
import { collectionApi, isDuplicateCollectionNameError } from "./collection.api";

describe("collectionApi", () => {
  it("sends the exact selected UUIDs to the atomic replacement RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const collectionIds = ["collection-one", "collection-two"];

    await collectionApi.replaceRecipeMemberships(
      { rpc } as never,
      "recipe-id",
      collectionIds
    );

    expect(rpc).toHaveBeenCalledWith("replace_recipe_collections", {
      p_recipe_id: "recipe-id",
      p_collection_ids: collectionIds,
    });
  });

  it("sends an empty list when a recipe is in no Collections", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });

    await collectionApi.replaceRecipeMemberships({ rpc } as never, "recipe-id", []);

    expect(rpc).toHaveBeenCalledWith("replace_recipe_collections", {
      p_recipe_id: "recipe-id",
      p_collection_ids: [],
    });
  });

  it("recognizes duplicate-name constraint errors", () => {
    expect(isDuplicateCollectionNameError({ code: "23505" })).toBe(true);
    expect(isDuplicateCollectionNameError({ code: "PGRST116" })).toBe(false);
  });
});
