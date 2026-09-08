import { describe, expect, it } from "vitest";
import {
  nutritionForSnapshot,
  snapshotNutrition,
  toSnapshotAnnotation,
  toStoredAnnotation,
} from "./recipeShare.transformer";
import type { SnapshotStepAnnotation } from "@/types/recipeShare.types";

const stepText = "Beat in the eggs, then fold in the 250 g flour and rest for 10 minutes.";

/** What the extractor stores on the sharer's step row. */
const stored = {
  v: 1,
  template: "Beat in the {0}, then fold in the {1} and rest for {2}.",
  entities: [
    { t: "ing", ingredient_id: "row-eggs", text: "eggs", emoji: "🥚", amount: false },
    { t: "ing", ingredient_id: "row-flour", text: "250 g flour", emoji: "🌾", amount: true },
    { t: "timer", seconds: 600, text: "10 minutes", label: "Rest the batter" },
  ],
};

/** The sharer's ingredient rows by position in the snapshot: flour first. */
const positions = new Map([
  ["row-flour", 0],
  ["row-eggs", 1],
]);

describe("toSnapshotAnnotation", () => {
  it("rewrites ingredient row ids to snapshot positions", () => {
    expect(toSnapshotAnnotation(stored, stepText, positions)).toEqual({
      v: 1,
      template: stored.template,
      entities: [
        { t: "ing", ingredient_index: 1, text: "eggs", emoji: "🥚", amount: false },
        { t: "ing", ingredient_index: 0, text: "250 g flour", emoji: "🌾", amount: true },
        { t: "timer", seconds: 600, seconds_max: null, text: "10 minutes", label: "Rest the batter" },
      ],
    });
  });

  it("leaves out an annotation mentioning an ingredient the recipe no longer has", () => {
    expect(toSnapshotAnnotation(stored, stepText, new Map([["row-flour", 0]]))).toBeNull();
  });

  it("leaves out an annotation whose step text has moved on", () => {
    expect(toSnapshotAnnotation(stored, "Something else entirely.", positions)).toBeNull();
  });

  it("ships the processed-nothing-to-mark marker as it is", () => {
    const marker = { v: 1, template: stepText, entities: [] };
    expect(toSnapshotAnnotation(marker, stepText, new Map())).toEqual(marker);
  });

  it("leaves out anything it cannot vouch for", () => {
    expect(toSnapshotAnnotation(null, stepText, positions)).toBeNull();
    expect(toSnapshotAnnotation("not an object", stepText, positions)).toBeNull();
    expect(toSnapshotAnnotation({ ...stored, v: 2 }, stepText, positions)).toBeNull();
    expect(
      toSnapshotAnnotation(
        { v: 1, template: "Bake at {0}.", entities: [{ t: "temperature", text: "180°C" }] },
        "Bake at 180°C.",
        positions
      )
    ).toBeNull();
  });
});

describe("toStoredAnnotation", () => {
  const annotation: SnapshotStepAnnotation = {
    v: 1,
    template: "Fold in the {0} and rest for {1}.",
    entities: [
      { t: "ing", ingredient_index: 1, text: "flour", emoji: "🌾", amount: false },
      { t: "timer", seconds: 600, seconds_max: null, text: "10 minutes", label: "Rest" },
    ],
  };

  it("resolves positions to the minted row ids", () => {
    expect(toStoredAnnotation(annotation, ["id-0", "id-1"])).toEqual({
      v: 1,
      template: annotation.template,
      entities: [
        { t: "ing", ingredient_id: "id-1", text: "flour", emoji: "🌾", amount: false },
        { t: "timer", seconds: 600, text: "10 minutes", label: "Rest" },
      ],
    });
  });

  it("keeps a range bound only when it is a real upper bound", () => {
    const withRange = (seconds_max: number): SnapshotStepAnnotation => ({
      v: 1,
      template: "Simmer for {0}.",
      entities: [{ t: "timer", seconds: 600, seconds_max, text: "10-15 minutes", label: "Simmer" }],
    });
    expect(toStoredAnnotation(withRange(900), [])?.entities[0]).toEqual({
      t: "timer",
      seconds: 600,
      seconds_max: 900,
      text: "10-15 minutes",
      label: "Simmer",
    });
    expect(toStoredAnnotation(withRange(300), [])?.entities[0]).not.toHaveProperty("seconds_max");
  });

  it("writes nothing for a position without a row", () => {
    expect(toStoredAnnotation(annotation, ["id-0"])).toBeNull();
  });

  it("writes nothing for an entity kind it does not know, or no annotation at all", () => {
    const unknown = {
      v: 1,
      template: "Bake at {0}.",
      entities: [{ t: "temperature", text: "180°C" }],
    } as unknown as SnapshotStepAnnotation;
    expect(toStoredAnnotation(unknown, [])).toBeNull();
    expect(toStoredAnnotation(undefined, [])).toBeNull();
    expect(toStoredAnnotation(null, [])).toBeNull();
  });
});

describe("snapshot nutrition", () => {
  const empty = {
    calories_kcal: null,
    carbs_g: null,
    protein_g: null,
    fat_g: null,
    sugar_g: null,
    fiber_g: null,
    sodium_mg: null,
  };

  it("leaves the key out when nothing is calculated", () => {
    expect(nutritionForSnapshot(empty)).toBeNull();
    expect(nutritionForSnapshot({ ...empty, calories_kcal: 520 })).toEqual({
      ...empty,
      calories_kcal: 520,
    });
  });

  it("reads a snapshot value back into the seven-column row shape", () => {
    expect(snapshotNutrition({ nutrition: { calories_kcal: 520 } as never })).toEqual({
      ...empty,
      calories_kcal: 520,
    });
    expect(snapshotNutrition({})).toBeNull();
    expect(snapshotNutrition({ nutrition: null })).toBeNull();
    expect(snapshotNutrition({ nutrition: empty })).toBeNull();
  });
});
