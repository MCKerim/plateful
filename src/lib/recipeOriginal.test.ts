import { describe, expect, it } from "vitest";
import { matchesOriginal, parseRecipeOriginal, type RecipeOriginal } from "./recipeOriginal";

const row = {
  id: "o1",
  snapshot: {
    title: "Pancakes",
    description: "Fluffy",
    instructions: [{ step: "Mix", section: null }],
    ingredients: [
      { item: "200 g flour", section: null },
      { item: "2 eggs", section: "Batter" },
    ],
    servings: null,
    servingsUnit: null,
  },
  translations: {
    de: {
      title: "Pfannkuchen",
      description: "Fluffig",
      instructions: [{ step: "Mischen", section: null }],
      ingredients: [
        { item: "200 g Mehl", section: null },
        { item: "2 Eier", section: "Teig" },
      ],
      servings: 3.6,
    },
    fr: { title: "Crêpes" },
  },
};

function original(): RecipeOriginal {
  const parsed = parseRecipeOriginal(row);
  if (!parsed) throw new Error("fixture must parse");
  return parsed;
}

describe("matchesOriginal", () => {
  it("matches an untouched import in the source language, null servings counting as 1", () => {
    expect(
      matchesOriginal(original(), {
        name: "Pancakes",
        ingredientLines: ["200 g flour", "2 eggs"],
        baseServings: 1,
      })
    ).toBe(true);
  });

  it("matches an untouched import written in a cached translation, servings rounded", () => {
    expect(
      matchesOriginal(original(), {
        name: "Pfannkuchen",
        ingredientLines: ["200 g Mehl", "2 Eier"],
        baseServings: 4,
      })
    ).toBe(true);
  });

  it("differs after a rename, reordered, dropped or extra lines, other servings", () => {
    const untouched = {
      name: "Pancakes",
      ingredientLines: ["200 g flour", "2 eggs"],
      baseServings: 1,
    };
    expect(matchesOriginal(original(), { ...untouched, name: "Best pancakes" })).toBe(false);
    expect(
      matchesOriginal(original(), { ...untouched, ingredientLines: ["2 eggs", "200 g flour"] })
    ).toBe(false);
    expect(matchesOriginal(original(), { ...untouched, ingredientLines: ["200 g flour"] })).toBe(
      false
    );
    expect(
      matchesOriginal(original(), {
        ...untouched,
        ingredientLines: ["200 g flour", "2 eggs", "1 pinch salt"],
      })
    ).toBe(false);
    expect(matchesOriginal(original(), { ...untouched, baseServings: 2 })).toBe(false);
    // Name from one snapshot, lines from another: not an untouched import.
    expect(
      matchesOriginal(original(), { ...untouched, ingredientLines: ["200 g Mehl", "2 Eier"] })
    ).toBe(false);
  });
});

describe("parseRecipeOriginal", () => {
  it("skips a malformed translation and rejects a malformed source snapshot", () => {
    expect(original().translations).toHaveLength(1);
    expect(parseRecipeOriginal({ ...row, snapshot: { title: "Pancakes" } })).toBeNull();
  });
});
