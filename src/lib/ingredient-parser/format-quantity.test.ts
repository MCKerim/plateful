import { describe, expect, it } from "vitest";
import { formatQuantity, formatScaledQuantity, roundQuantity } from "./format-quantity";
import { getScaledQuantityDisplay, scaleIngredient } from "./scale-ingredients";
import type { RecipeIngredient } from "@/types/ingredient.types";

function ingredient(value: number | null, display: string | null, unit: string | null, name = "thing"): RecipeIngredient {
  return {
    id: "x",
    recipeId: "recipe",
    rawText: [display, unit, name].filter(Boolean).join(" "),
    quantity: { value, display },
    unit,
    unitNormalized: null,
    name,
    nameNormalized: null,
    preparationNote: null,
    isOptional: false,
    isScalable: true,
    groupName: null,
    sortOrder: 0,
    ingredientSlug: null,
  };
}

// One rule for every scaled amount, the same in every unit and on every
// surface (Kerim, 2026-11-20: "like Chefkoch, at most two decimals, the same
// everywhere or it confuses").
describe("roundQuantity", () => {
  it("keeps at most two decimals, half away from zero", () => {
    expect(roundQuantity(3.75)).toBe(3.75);
    expect(roundQuantity(10.5)).toBe(10.5);
    expect(roundQuantity(583.333)).toBe(583.33);
    expect(roundQuantity(1.125)).toBe(1.13);
    expect(roundQuantity(0.3333)).toBe(0.33);
    expect(roundQuantity(1.666)).toBe(1.67);
    expect(roundQuantity(4)).toBe(4);
    expect(roundQuantity(-1.125)).toBe(-1.13);
  });

  it("rounds the shortest spelling, not the binary value", () => {
    expect(roundQuantity(0.285)).toBe(0.29);
    expect(roundQuantity(1.005)).toBe(1.01);
    expect(roundQuantity(1.14 * 0.25)).toBe(0.29);
  });
});

describe("formatQuantity", () => {
  it("drops trailing zeros and uses the locale's separator", () => {
    expect(formatQuantity(583.333, "de")).toBe("583,33");
    expect(formatQuantity(583.333, "en")).toBe("583.33");
    expect(formatQuantity(1.125, "de")).toBe("1,13");
    expect(formatQuantity(1.5, "de")).toBe("1,5");
    expect(formatQuantity(4, "de")).toBe("4");
    expect(formatQuantity(1000, "de")).toBe("1000");
  });

  it("writes a point without a locale, for stored text", () => {
    expect(formatQuantity(2.333)).toBe("2.33");
    expect(formatQuantity(1.125)).toBe("1.13");
    expect(formatQuantity(null)).toBe("");
  });
});

describe("scaled amounts in the recipe view", () => {
  it("round to two decimals in every unit, with a German comma", () => {
    expect(getScaledQuantityDisplay(ingredient(5, "5", null, "Eier"), 4, 3, "de")).toBe("3,75");
    expect(getScaledQuantityDisplay(ingredient(7, "7", null, "Eier"), 2, 3, "de")).toBe("10,5");
    expect(getScaledQuantityDisplay(ingredient(1, "1", null, "Ei"), 4, 5, "de")).toBe("1,25");
    expect(getScaledQuantityDisplay(ingredient(350, "350", "g"), 3, 5, "de")).toBe("583,33");
    expect(getScaledQuantityDisplay(ingredient(350, "350", "g"), 3, 5, "en")).toBe("583.33");
    expect(getScaledQuantityDisplay(ingredient(0.75, "0,75", "kg"), 2, 3, "de")).toBe("1,13");
    expect(getScaledQuantityDisplay(ingredient(1, "1", "cup"), 3, 1, "de")).toBe("0,33");
    expect(getScaledQuantityDisplay(ingredient(1, "1", "tsp"), 3, 5, "de")).toBe("1,67");
    expect(getScaledQuantityDisplay(ingredient(2, "2", "EL"), 2, 4, "de")).toBe("4");
  });

  it("leave the recipe's own number at 1x", () => {
    expect(getScaledQuantityDisplay(ingredient(0.75, "0,75", "kg"), 2, 2, "en")).toBe("0,75");
  });

  it("scale a range on both ends", () => {
    expect(formatScaledQuantity(2.5, "2-3", 1.25, "de")).toBe("2,5-3,75");
  });

  it("read the same in the full line the cooking mode shows", () => {
    const flour = ingredient(350, "350", "g", "Mehl");
    expect(scaleIngredient(flour, 5 / 3, "de").scaledQuantity.display).toBe("583,33 g Mehl");
  });
});
