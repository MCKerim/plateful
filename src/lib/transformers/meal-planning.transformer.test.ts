import { describe, it, expect } from "vitest";
import {
  parseMealType,
  parsePlannedDate,
  transformMealPlannerItems,
  transformPlannedItemsSummary,
} from "./meal-planning.transformer";
import type { MealPlannerItemRaw, PlannedItemSummaryRaw } from "@/types/meal-planning.types";

const recipeRow: MealPlannerItemRaw = {
  id: "placement-1",
  planned_date: "2026-09-13",
  eaten: false,
  meal_type: null,
  recipes: { id: "recipe-1", name: "Pasta", tags: ["main"] },
  planner_notes: null,
};

const noteRow: MealPlannerItemRaw = {
  id: "placement-2",
  planned_date: "2026-09-14",
  eaten: null,
  meal_type: null,
  recipes: null,
  planner_notes: { id: "note-1", text: "Eating out" },
};

describe("transformMealPlannerItems", () => {
  it("keeps a recipe row a recipe", () => {
    expect(transformMealPlannerItems([recipeRow])).toEqual([
      {
        kind: "recipe",
        id: "placement-1",
        recipeId: "recipe-1",
        recipeName: "Pasta",
        recipeTags: ["main"],
        planned_date: new Date(2026, 8, 13),
        mealType: "dinner",
        eaten: false,
      },
    ]);
  });

  it("turns a note row with a null eaten flag into a note", () => {
    expect(transformMealPlannerItems([noteRow])).toEqual([
      {
        kind: "note",
        id: "placement-2",
        noteId: "note-1",
        text: "Eating out",
        planned_date: new Date(2026, 8, 14),
        mealType: "dinner",
      },
    ]);
  });

  it("drops a placement whose content is gone", () => {
    const orphan: MealPlannerItemRaw = {
      id: "placement-3",
      planned_date: "2026-09-15",
      eaten: null,
      meal_type: null,
      recipes: null,
      planner_notes: null,
    };
    expect(transformMealPlannerItems([orphan, noteRow]).map((item) => item.id)).toEqual([
      "placement-2",
    ]);
  });

  it("carries the meal type of recipes and notes alike", () => {
    const items = transformMealPlannerItems([
      { ...recipeRow, meal_type: "breakfast" },
      { ...noteRow, meal_type: "snack" },
    ]);
    expect(items.map((item) => item.mealType)).toEqual(["breakfast", "snack"]);
  });

  it("keeps a pool row dateless", () => {
    const pooled = transformMealPlannerItems([{ ...noteRow, planned_date: null }]);
    expect(pooled[0].planned_date).toBeNull();
  });
});

describe("parseMealType", () => {
  it("keeps the three types that show a chip", () => {
    expect(["breakfast", "lunch", "snack"].map(parseMealType)).toEqual([
      "breakfast",
      "lunch",
      "snack",
    ]);
  });

  it("reads NULL and an unknown value as dinner", () => {
    expect([null, "dinner", "dessert"].map(parseMealType)).toEqual(["dinner", "dinner", "dinner"]);
  });
});

describe("parsePlannedDate", () => {
  it("reads a plain date as local midnight, not UTC", () => {
    const date = parsePlannedDate("2026-09-13")!;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 13]);
    expect(date.getHours()).toBe(0);
  });

  it("passes null through", () => {
    expect(parsePlannedDate(null)).toBeNull();
  });
});

describe("transformPlannedItemsSummary", () => {
  it("labels recipes by name and notes by text, skipping the pool", () => {
    const raw: PlannedItemSummaryRaw[] = [
      { planned_date: "2026-09-13", recipes: { name: "Pasta" }, planner_notes: null },
      { planned_date: "2026-09-13", recipes: null, planner_notes: { text: "Leftovers" } },
      { planned_date: null, recipes: { name: "Pooled" }, planner_notes: null },
    ];
    expect(transformPlannedItemsSummary(raw)).toEqual([
      { planned_date: "2026-09-13", kind: "recipe", label: "Pasta" },
      { planned_date: "2026-09-13", kind: "note", label: "Leftovers" },
    ]);
  });
});
