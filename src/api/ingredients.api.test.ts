import { describe, expect, it } from "vitest";
import { ingredientsApi } from "./ingredients.api";

type Client = Parameters<typeof ingredientsApi.replaceAll>[0];

function fakeSupabase(error: { message: string } | null = null) {
  const calls: { name: string; args: unknown }[] = [];
  const supabase = {
    rpc: async (name: string, args: unknown) => (calls.push({ name, args }), { data: null, error }),
  } as unknown as Client;
  return { supabase, calls };
}

describe("ingredientsApi.replaceAll", () => {
  it("sends every line parsed, in order, with its section", async () => {
    const { supabase, calls } = fakeSupabase();
    await ingredientsApi.replaceAll(supabase, "recipe-1", [
      { rawText: "200 g Mehl, gesiebt", groupName: "Teig", sortOrder: 0 },
      { rawText: "Salz", groupName: null, sortOrder: 1 },
    ]);
    expect(calls).toEqual([
      {
        name: "replace_recipe_ingredients",
        args: {
          p_recipe_id: "recipe-1",
          p_lines: [
            expect.objectContaining({
              raw_text: "200 g Mehl, gesiebt",
              quantity_value: 200,
              unit: "g",
              ingredient_name: "Mehl",
              preparation_note: "gesiebt",
              is_scalable: true,
              group_name: "Teig",
              sort_order: 0,
            }),
            expect.objectContaining({
              raw_text: "Salz",
              quantity_value: null,
              is_scalable: false,
              group_name: null,
              sort_order: 1,
            }),
          ],
        },
      },
    ]);
  });

  it("sends an empty list too, so the recipe is cleared", async () => {
    const { supabase, calls } = fakeSupabase();
    await ingredientsApi.replaceAll(supabase, "recipe-1", []);
    expect(calls).toEqual([
      { name: "replace_recipe_ingredients", args: { p_recipe_id: "recipe-1", p_lines: [] } },
    ]);
  });

  it("throws the server's refusal", async () => {
    const { supabase } = fakeSupabase({ message: "Recipe is unavailable" });
    await expect(ingredientsApi.replaceAll(supabase, "recipe-1", [{ rawText: "Salz" }])).rejects.toMatchObject({
      message: "Recipe is unavailable",
    });
  });
});
