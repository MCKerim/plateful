import { describe, expect, it, vi } from "vitest";
import { recipeShareApi } from "./recipeShare.api";
import { nutritionApi } from "@/api/nutrition.api";
import type { SharedRecipeSnapshot, SnapshotIngredient } from "@/types/recipeShare.types";

vi.mock("@/api/nutrition.api", () => ({
  nutritionApi: { refresh: vi.fn().mockResolvedValue(undefined) },
}));

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

function ingredient(rawText: string, sortOrder: number): SnapshotIngredient {
  return {
    raw_text: rawText,
    quantity_value: null,
    quantity_display: null,
    unit: null,
    ingredient_name: rawText,
    group_name: null,
    sort_order: sortOrder,
    is_scalable: true,
    is_optional: false,
    preparation_note: null,
  };
}

/** A Supabase stand-in that records every insert by table. */
function fakeSupabase() {
  const inserts: Record<string, unknown[]> = {};
  const supabase = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    from: vi.fn((table: string) => ({
      insert: vi.fn((payload: unknown) => {
        (inserts[table] ??= []).push(payload);
        const result = Promise.resolve({ data: { id: "recipe-1" }, error: null });
        return Object.assign(result, {
          select: () => ({
            single: () => Promise.resolve({ data: { id: "recipe-1" }, error: null }),
          }),
        });
      }),
    })),
  };
  return { supabase, inserts };
}

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
    const { supabase, inserts } = fakeSupabase();

    await recipeShareApi.importIntoHousehold(supabase as never, snapshot, "household-1");

    const inserted = inserts.recipes?.[0] as Record<string, unknown>;
    expect(snapshot.base_servings).toBeNull();
    expect(inserted.base_servings).toBe(1);
  });

  it("copies the sharer's nutrition instead of asking for an estimate", async () => {
    vi.mocked(nutritionApi.refresh).mockClear();
    const { supabase, inserts } = fakeSupabase();
    const shared: SharedRecipeSnapshot = {
      ...snapshot,
      ingredients: [ingredient("2 tomatoes", 0)],
      nutrition: {
        calories_kcal: 520,
        carbs_g: 62,
        protein_g: 18,
        fat_g: 21,
        sugar_g: 9,
        fiber_g: 5,
        sodium_mg: 740,
      },
      nutrition_auto: false,
    };

    await recipeShareApi.importIntoHousehold(supabase as never, shared, "household-1");

    const recipe = inserts.recipes?.[0] as Record<string, unknown>;
    expect(recipe.calories_kcal).toBe(520);
    expect(recipe.sodium_mg).toBe(740);
    expect(recipe.nutrition_auto).toBe(false);
    expect(nutritionApi.refresh).not.toHaveBeenCalled();
  });

  it("asks for a first estimate when the snapshot carries no nutrition", async () => {
    vi.mocked(nutritionApi.refresh).mockClear();
    const { supabase, inserts } = fakeSupabase();

    await recipeShareApi.importIntoHousehold(
      supabase as never,
      { ...snapshot, ingredients: [ingredient("2 tomatoes", 0)] },
      "household-1"
    );

    const recipe = inserts.recipes?.[0] as Record<string, unknown>;
    expect(recipe).not.toHaveProperty("calories_kcal");
    expect(recipe.nutrition_auto).toBe(true);
    expect(nutritionApi.refresh).toHaveBeenCalledWith(supabase, "recipe-1");
  });

  it("mints ingredient ids and points the copied annotations at them", async () => {
    const { supabase, inserts } = fakeSupabase();
    const shared: SharedRecipeSnapshot = {
      ...snapshot,
      ingredients: [ingredient("250 g flour", 0), ingredient("3 eggs", 1)],
      instruction_steps: [
        {
          step_text: "Beat in the eggs.",
          group_name: null,
          sort_order: 0,
          annotation: {
            v: 1,
            template: "Beat in the {0}.",
            entities: [{ t: "ing", ingredient_index: 1, text: "eggs", emoji: "🥚", amount: false }],
          },
        },
        { step_text: "Let it rest.", group_name: null, sort_order: 1 },
      ],
    };

    await recipeShareApi.importIntoHousehold(supabase as never, shared, "household-1");

    const ingredientRows = inserts.recipe_ingredients?.[0] as Array<{ id: string; raw_text: string }>;
    expect(ingredientRows.map((row) => row.raw_text)).toEqual(["250 g flour", "3 eggs"]);
    expect(ingredientRows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ingredientRows[0].id).not.toBe(ingredientRows[1].id);

    const stepRows = inserts.recipe_instructions?.[0] as Array<{
      step_text: string;
      annotation: { entities: Array<{ ingredient_id: string }> } | null;
    }>;
    expect(stepRows[0].annotation?.entities[0].ingredient_id).toBe(ingredientRows[1].id);
    expect(stepRows[1].annotation).toBeNull();
  });
});
