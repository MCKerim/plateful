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
  recipes: {
    id: "recipe-1",
    name: "Pasta",
    tags: ["main"],
    image_path: "recipe_recipe-1/cover.jpg",
  },
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

const coverUrlOf = (imagePath: string | null) => imagePath && `https://covers.test/${imagePath}`;

describe("transformMealPlannerItems", () => {
  it("keeps a recipe row a recipe", () => {
    expect(transformMealPlannerItems([recipeRow], coverUrlOf)).toEqual([
      {
        kind: "recipe",
        id: "placement-1",
        recipeId: "recipe-1",
        recipeName: "Pasta",
        recipeTags: ["main"],
        coverUrl: "https://covers.test/recipe_recipe-1/cover.jpg",
        planned_date: new Date(2026, 8, 13),
        mealType: "dinner",
        eaten: false,
      },
    ]);
  });

  it("turns a note row with a null eaten flag into a note", () => {
    expect(transformMealPlannerItems([noteRow], coverUrlOf)).toEqual([
      {
        kind: "note",
        id: "placement-2",
        noteId: "note-1",
        text: "Eating out",
        planned_date: new Date(2026, 8, 14),
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
    expect(transformMealPlannerItems([orphan, noteRow], coverUrlOf).map((item) => item.id)).toEqual(
      ["placement-2"]
    );
  });

  it("reads a recipe's meal type and ignores the one an older build stored on a note", () => {
    const [recipe, note] = transformMealPlannerItems(
      [
        { ...recipeRow, meal_type: "breakfast" },
        { ...noteRow, meal_type: "snack" },
      ],
      coverUrlOf
    );
    expect(recipe).toMatchObject({ kind: "recipe", mealType: "breakfast" });
    expect(note).not.toHaveProperty("mealType");
  });

  it("gives a recipe without a cover no URL", () => {
    const [recipe] = transformMealPlannerItems(
      [{ ...recipeRow, recipes: { ...recipeRow.recipes!, image_path: null } }],
      coverUrlOf
    );
    expect(recipe).toMatchObject({ kind: "recipe", coverUrl: null });
  });

  it("keeps a pool row dateless", () => {
    const pooled = transformMealPlannerItems([{ ...noteRow, planned_date: null }], coverUrlOf);
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
  it("labels recipes by name with their meal type and notes by text alone, skipping the pool", () => {
    const raw: PlannedItemSummaryRaw[] = [
      {
        planned_date: "2026-09-13",
        meal_type: "lunch",
        recipes: { name: "Pasta" },
        planner_notes: null,
      },
      {
        planned_date: "2026-09-13",
        meal_type: "breakfast",
        recipes: null,
        planner_notes: { text: "Leftovers" },
      },
      { planned_date: null, meal_type: null, recipes: { name: "Pooled" }, planner_notes: null },
    ];
    expect(transformPlannedItemsSummary(raw)).toEqual([
      { planned_date: "2026-09-13", kind: "recipe", label: "Pasta", mealType: "lunch" },
      { planned_date: "2026-09-13", kind: "note", label: "Leftovers" },
    ]);
  });
});
