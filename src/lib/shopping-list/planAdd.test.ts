import { describe, expect, it } from "vitest";
import {
  canScale,
  isSelectedByDefault,
  listAmount,
  planDays,
  planLines,
  planMeals,
  planPortions,
  roundScaled,
  servingsScale,
  type PlanPortion,
} from "@/lib/shopping-list/planAdd";
import { itemAmountText } from "@/lib/shopping-list/item";
import { checklistIndex } from "@/lib/shopping-list/list";
import type { ShoppingDictionaryEntry } from "@/lib/shopping-list/item";
import { makeIngredient, makeItem, PINCH } from "@/lib/shopping-list/testItems";
import { getWeekdays } from "@/lib/dateHelper/dateHelper";
import type { MealPlannerItem } from "@/types/meal-planning.types";
import type { IngredientsBundle, RecipeIngredient } from "@/types/ingredient.types";

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
    expect(listAmount(fixed, 2)).toEqual({
      quantityValue: 1,
      quantityDisplay: null,
      unit: "Prise",
    });
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

/** Local midnight of an October 2026 day; the 7th is a Wednesday, "today". */
const october = (day: number) => new Date(2026, 9, day);

let placementCount = 0;
function meal(recipeId: string, day: number | null, eaten = false): MealPlannerItem {
  placementCount += 1;
  return {
    kind: "recipe",
    id: `p${placementCount}`,
    recipeId,
    recipeName: recipeId,
    recipeTags: [],
    coverUrl: null,
    planned_date: day === null ? null : october(day),
    mealType: "dinner",
    eaten,
  };
}

/** The week `offset` weeks from the 7th, Monday-first, seen on the 7th at noon. */
function meals(planned: MealPlannerItem[], offset = 0) {
  return planMeals(planned, getWeekdays(october(7 + offset * 7), 1), new Date(2026, 9, 7, 12));
}

const ids = (offered: { recipeId: string }[]) => offered.map((entry) => entry.recipeId);

describe("planMeals", () => {
  it("runs the current week from today to its end", () => {
    const offered = meals([
      meal("monday", 5),
      meal("today", 7),
      meal("sunday", 11),
      meal("next-monday", 12),
    ]);
    expect(ids(offered)).toEqual(["today", "sunday"]);
    expect(offered[0].day).toEqual(october(7));
  });

  it("offers a later week whole and a past one not at all", () => {
    const planned = [
      meal("last-week", 1),
      meal("friday", 9),
      meal("monday", 12),
      meal("sunday", 18),
      meal("pool", null),
    ];
    expect(ids(meals(planned, 1))).toEqual(["pool", "monday", "sunday"]);
    expect(meals(planned, -1)).toEqual([]);
  });

  it("leaves cooked meals and notes out", () => {
    const note: MealPlannerItem = {
      kind: "note",
      id: "n1",
      noteId: "note",
      text: "Eating out",
      planned_date: october(8),
    };
    const offered = meals([
      meal("cooked", 8, true),
      note,
      meal("open", 8),
      meal("cooked-pool", null, true),
    ]);
    expect(ids(offered)).toEqual(["open"]);
  });

  it("puts the pool first, then the days in the plan's order", () => {
    const offered = meals([
      meal("curry", 9),
      meal("pool", null),
      meal("soup", 8),
      meal("salad", 9),
    ]);
    expect(ids(offered)).toEqual(["pool", "soup", "curry", "salad"]);
    expect(offered[0].day).toBeNull();
  });

  it("makes a recipe planned twice two rows, the later ones repeats", () => {
    const planned = [
      meal("lasagne", 9),
      meal("soup", 8),
      meal("lasagne", 8),
      meal("lasagne", null),
    ];
    const offered = meals(planned);
    expect(ids(offered)).toEqual(["lasagne", "soup", "lasagne", "lasagne"]);
    expect(offered.map((entry) => entry.id)).toEqual([
      planned[3].id,
      planned[1].id,
      planned[2].id,
      planned[0].id,
    ]);
    // The first dated placement is the one to shop for; the pool copy never wins.
    expect(offered.map((entry) => entry.isRepeat)).toEqual([true, false, false, true]);
  });

  it("groups the meals under their days, the pool first", () => {
    const days = planDays(
      meals([meal("curry", 9), meal("pool", null), meal("soup", 8), meal("salad", 9)])
    );
    expect(days.map((day) => day.day)).toEqual([null, october(8), october(9)]);
    expect(days.map((day) => ids(day.meals))).toEqual([["pool"], ["soup"], ["curry", "salad"]]);
  });

  it("starts a repeat or a recipe on the list off", () => {
    const offered = meals([meal("new", 7), meal("on-list", 8), meal("new", 9)]);
    expect(offered.map((entry) => isSelectedByDefault(entry, new Set(["on-list"])))).toEqual([
      true,
      false,
      false,
    ]);
  });
});

const index = checklistIndex([], dictionary);

/** One recipe's rows at scale 1, the way most checklist tests merge them. */
const lines = (rows: RecipeIngredient[]) =>
  planLines([{ recipeId: "recipe", ingredients: rows, scale: 1 }], index);

describe("planPortions", () => {
  it("adds a recipe's scales up, but not where nothing scales", () => {
    const bundle = (base: number | null, rows: RecipeIngredient[]): IngredientsBundle => ({
      baseServings: base,
      servingsUnit: null,
      ingredients: rows,
    });
    const twice = meals([
      meal("curry", 7),
      meal("curry", 8),
      meal("soup", 8),
      meal("soup", 9),
      meal("unloaded", 9),
    ]);
    const portions = planPortions(
      twice,
      (entry) => (entry.day?.getTime() === october(7).getTime() ? 6 : 4),
      new Map([
        ["curry", bundle(4, [makeIngredient("a", 300, "g", "Tomaten")])],
        ["soup", bundle(null, [makeIngredient("b", 1, null, "Zitrone")])],
      ])
    );
    expect(portions.map((portion) => [portion.recipeId, portion.scale])).toEqual([
      ["curry", 2.5],
      ["soup", 1],
    ]);
  });
});

describe("planLines", () => {
  it("scales a portion's scalable lines and drops the written amount", () => {
    const merged = planLines(
      [
        {
          recipeId: "r",
          ingredients: [
            makeIngredient("a", 300, "g", "Tomaten", { slug: "tomato" }),
            makeIngredient("b", 250, "ml", "Milch", { slug: "milk", order: 1 }),
            PINCH,
          ],
          scale: 2,
        },
      ],
      index
    );
    expect(merged.map((line) => line.item.name)).toEqual([
      "Tomaten",
      "Milch",
      "a pinch of sea salt",
    ]);
    expect(merged[0].item.quantityValue).toBe(600);
    expect(merged[0].item.quantityDisplay).toBeNull();
    expect(itemAmountText(merged[0].item, "en")).toBe("600 g");
    expect(itemAmountText(merged[1].item, "en")).toBe("500 ml");
    expect(merged[2].item.quantityValue).toBeNull();
    expect(merged.flatMap((line) => line.ingredients.map((sent) => sent.scale))).toEqual([2, 2, 2]);
  });

  it("keeps the written amount at scale 1", () => {
    const merged = lines([makeIngredient("a", 0.5, "tsp", "Pfeffer")]);
    expect(merged[0].item.quantityDisplay).toBe("0.5");
    expect(merged[0].ingredients).toEqual([{ ingredientId: "a", scale: 1 }]);
  });

  it("sums two recipes' lines at their own scales and names both recipes", () => {
    const portions: PlanPortion[] = [
      {
        recipeId: "lasagne",
        ingredients: [makeIngredient("a", 300, "g", "Tomaten", { slug: "tomato" })],
        scale: 2,
      },
      {
        recipeId: "soup",
        ingredients: [makeIngredient("b", 200, "g", "tomatoes", { slug: "tomato", order: 1 })],
        scale: 0.5,
      },
    ];
    const merged = planLines(portions, index);
    expect(merged).toHaveLength(1);
    expect(merged[0].item.quantityValue).toBe(700);
    expect(merged[0].recipeIds).toEqual(["lasagne", "soup"]);
    expect(merged[0].ingredients).toEqual([
      { ingredientId: "a", scale: 2 },
      { ingredientId: "b", scale: 0.5 },
    ]);
  });

  it("sums the same product in the same unit", () => {
    const merged = lines([
      makeIngredient("a", 300, "g", "Tomaten", { slug: "tomato" }),
      makeIngredient("b", 200, "g", "tomatoes", { slug: "tomato", order: 1 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].item).toMatchObject({
      name: "Tomaten",
      quantityValue: 500,
      unit: "g",
      aisle: "produce",
    });
    expect(merged[0].ingredients.map((sent) => sent.ingredientId)).toEqual(["a", "b"]);
    expect(merged[0].recipeIds).toEqual(["recipe"]);
  });

  it("keeps a different unit as text", () => {
    const merged = lines([
      makeIngredient("a", 500, "g", "Mehl", { slug: "flour" }),
      makeIngredient("b", 2, "EL", "Mehl", { slug: "flour", order: 1 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(itemAmountText(merged[0].item, "en")).toBe("500 g + 2 EL");
    expect(merged[0].isStaple).toBe(true);
  });

  it("merges lines without a slug by name", () => {
    const merged = lines([
      makeIngredient("a", 1, null, "Zitrone"),
      makeIngredient("b", 2, null, "zitrone ", { order: 1 }),
      makeIngredient("c", null, null, "Zitrone", { order: 2 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].item.quantityValue).toBe(3);
    expect(merged[0].ingredients.map((sent) => sent.ingredientId)).toEqual(["a", "b", "c"]);
  });

  it("adds nothing for a line without an amount", () => {
    const merged = lines([
      makeIngredient("a", null, null, "Milch", { slug: "milk" }),
      makeIngredient("b", 250, "ml", "Milch", { slug: "milk", order: 1 }),
      makeIngredient("c", null, null, "Milch", { slug: "milk", order: 2 }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].item.quantityValue).toBe(250);
    expect(merged[0].item.unit).toBe("ml");
  });

  it("walks several recipes' rows in the server's order", () => {
    const merged = planLines(
      [
        {
          recipeId: "a",
          ingredients: [makeIngredient("a1", 1, null, "Zitrone", { order: 1 })],
          scale: 1,
        },
        {
          recipeId: "b",
          ingredients: [
            makeIngredient("b0", 1, null, "Limette", { order: 0 }),
            makeIngredient("b2", 1, null, "Zitrone", { order: 2 }),
          ],
          scale: 1,
        },
      ],
      index
    );
    expect(merged.map((line) => line.item.name)).toEqual(["Limette", "Zitrone"]);
    expect(merged[1].ingredients.map((sent) => sent.ingredientId)).toEqual(["a1", "b2"]);
    expect(merged[1].recipeIds).toEqual(["a", "b"]);
  });

  it("follows the store walk with the staples last", () => {
    const merged = lines([
      makeIngredient("a", 500, "g", "Mehl", { slug: "flour" }),
      makeIngredient("b", null, null, "Klopapier", { order: 1 }),
      makeIngredient("c", 1, "l", "Milch", { slug: "milk", order: 2 }),
      makeIngredient("d", 3, null, "Tomaten", { slug: "tomato", order: 3 }),
    ]);
    expect(merged.map((line) => line.item.name)).toEqual(["Tomaten", "Milch", "Klopapier", "Mehl"]);
    expect(merged.map((line) => line.id)).toEqual([
      "slug:tomato",
      "slug:milk",
      "name:klopapier",
      "slug:flour",
    ]);
  });
});
