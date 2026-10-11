import { describe, expect, it } from "vitest";
import { canScale, listAmount, roundScaled, servingsScale } from "@/lib/shopping-list/planAdd";
import { itemAmountText } from "@/lib/shopping-list/item";
import { checklistIndex } from "@/lib/shopping-list/list";
import type { ShoppingDictionaryEntry } from "@/lib/shopping-list/item";
import { makeIngredient, makeItem, PINCH } from "@/lib/shopping-list/testItems";

const dictionary: ShoppingDictionaryEntry[] = [
  { slug: "tomato", nameEn: "tomato", nameDe: "Tomate", aisle: "produce", isStaple: false },
  { slug: "milk", nameEn: "milk", nameDe: "Milch", aisle: "dairy", isStaple: false },
  { slug: "flour", nameEn: "flour", nameDe: "Mehl", aisle: "grains", isStaple: true },
  { slug: "salt", nameEn: "salt", nameDe: "Salz", aisle: "spices", isStaple: true },
];

describe("servings", () => {
  it("scales by servings over base, and by 1 where nothing scales", () => {
    const rows = [makeIngredient("a", 300, "g", "Tomaten", { slug: "tomato" })];
    expect(servingsScale(6, 4, rows)).toBe(1.5);
    expect(servingsScale(6, null, rows)).toBe(1);
    expect(servingsScale(6, 0, rows)).toBe(1);
    expect(canScale(4, [PINCH])).toBe(false);
    expect(servingsScale(6, 4, [PINCH])).toBe(1);
  });
});

describe("roundScaled", () => {
  it("rounds scaled amounts to shopping precision", () => {
    expect(roundScaled(583.333)).toBe(583);
    expect(roundScaled(16.666)).toBe(17);
    expect(roundScaled(9.96)).toBe(10);
    expect(roundScaled(2.5)).toBe(2.5);
    expect(roundScaled(1.666)).toBe(1.7);
    expect(roundScaled(0.4166)).toBe(0.42);
    expect(roundScaled(0.125)).toBe(0.13);
  });

  it("rounds a half at the rounding digit up like the server's numeric", () => {
    expect(roundScaled(0.285)).toBe(0.29);
    expect(roundScaled(1.14 * 0.25)).toBe(0.29);
  });
});

describe("listAmount", () => {
  it("drops the written amount once scaled and keeps it at scale 1", () => {
    const potatoes = makeIngredient("a", 350, "g", "Kartoffeln", { slug: "potato" });
    expect(listAmount(potatoes, 5 / 3)).toEqual({
      quantityValue: 583,
      quantityDisplay: null,
      unit: "g",
    });
    expect(listAmount(potatoes, 1)).toEqual({
      quantityValue: 350,
      quantityDisplay: "350",
      unit: "g",
    });
  });

  it("lands a written range as its midpoint once scaled", () => {
    const range = makeIngredient("r", 2.5, null, "Äpfel", { display: "2-3" });
    expect(itemAmountText(listAmount(range, 2), "en")).toBe("5");
    expect(itemAmountText(listAmount(range, 1), "en")).toBe("2-3");
  });

  it("leaves a line that doesn't scale as written", () => {
    expect(listAmount(PINCH, 2)).toEqual({
      quantityValue: null,
      quantityDisplay: null,
      unit: null,
    });
    const fixed = makeIngredient("f", 1, " Prise ", "Salz", { scalable: false });
    expect(listAmount(fixed, 2)).toEqual({ quantityValue: 1, quantityDisplay: null, unit: "Prise" });
  });
});

describe("checklistIndex", () => {
  it("knows staples, aisles and what is on the list by slug or name", () => {
    const index = checklistIndex(
      [
        makeItem("m", "Milch", "dairy", { slug: "milk" }),
        makeItem("z", "Zitronen", "produce"),
        makeItem("t", "Tomaten", "produce", { slug: "tomato", onList: false, boughtAt: 5 }),
      ],
      dictionary
    );
    expect([...index.staples].sort()).toEqual(["flour", "salt"]);
    expect(index.isStaple("flour")).toBe(true);
    expect(index.isStaple(null)).toBe(false);
    expect(index.aisle("milk")).toBe("dairy");
    expect(index.aisle(null)).toBe("other");
    expect(index.aisle("unknown")).toBe("other");
    expect(index.isOnList("milk", "milk")).toBe(true);
    expect(index.isOnList(null, " zitronen")).toBe(true);
    expect(index.isOnList("tomato", "Tomaten")).toBe(false);
  });

  it("starts a recipe's staples off and every other line on", () => {
    const index = checklistIndex([], dictionary);
    const rows = [
      makeIngredient("i1", 250, "g", "flour", { slug: "flour" }),
      makeIngredient("i2", 3, null, "eggs", { slug: "egg" }),
      makeIngredient("i3", 0.5, "tsp", "salt", { slug: "salt" }),
      makeIngredient("i4", 200, "g", "dark chocolate"),
      PINCH,
    ];
    expect(rows.filter((row) => !index.isStaple(row.ingredientSlug)).map((row) => row.id)).toEqual([
      "i2",
      "i4",
      "i5",
    ]);
  });
});
