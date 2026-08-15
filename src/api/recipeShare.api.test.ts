import { describe, expect, it, vi } from "vitest";
import { recipeShareApi } from "./recipeShare.api";
import type { SharedRecipeSnapshot } from "@/types/recipeShare.types";

const snapshot: SharedRecipeSnapshot = {
  name: "Tomato Soup",
  description: null,
  instructions: null,
  base_servings: null,
  servings_unit: null,
  link: null,
  image_urls: [],
  image_folder: "shared_00000000-0000-0000-0000-000000000001",
  ingredients: [],
};

describe("recipeShareApi", () => {
  it("resolves one share through the exact-token RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ snapshot }],
      error: null,
    });

    await expect(
      recipeShareApi.getByToken({ rpc } as never, "0123456789abcdef0123456789abcdef")
    ).resolves.toEqual({ snapshot });

    expect(rpc).toHaveBeenCalledWith("resolve_recipe_share", {
      p_token: "0123456789abcdef0123456789abcdef",
    });
  });

  it("returns null when the resolver finds no matching token", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    await expect(recipeShareApi.getByToken({ rpc } as never, "missing")).resolves.toBeNull();
  });

  it("surfaces resolver failures", async () => {
    const error = new Error("resolver unavailable");
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error,
    });

    await expect(recipeShareApi.getByToken({ rpc } as never, "token")).rejects.toBe(error);
  });

  // `recipes.base_servings` is NOT NULL. Snapshots taken before 2026-08-11 can
  // carry a null, and a column default only covers an omitted key — sending the
  // null on made share-accept fail outright.
  it("substitutes 1 for a snapshot with no base_servings", async () => {
    let inserted: Record<string, unknown> | undefined;
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => ({
        insert: vi.fn((payload: Record<string, unknown>) => {
          inserted = payload;
          return {
            select: () => ({
              single: () => Promise.resolve({ data: { id: "recipe-1" }, error: null }),
            }),
          };
        }),
      })),
    };

    await recipeShareApi.importIntoHousehold(supabase as never, snapshot, "household-1");

    expect(snapshot.base_servings).toBeNull();
    expect(inserted?.base_servings).toBe(1);
  });
});
