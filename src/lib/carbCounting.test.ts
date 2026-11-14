import { beforeEach, describe, expect, it } from "vitest";
import { NutritionValues } from "@/api/nutrition.api";
import {
  currentCarbCounting,
  regionDefaultCarbCounting,
  saveCarbCounting,
  shownNutrition,
  storedNutrition,
} from "./carbCounting";

const stored: NutritionValues = {
  calories_kcal: 500,
  carbs_g: 60,
  protein_g: 20,
  fat_g: 15,
  sugar_g: 8,
  fiber_g: 6,
  sodium_mg: 700,
};

const only = (values: Partial<NutritionValues>): NutritionValues => ({
  calories_kcal: null,
  carbs_g: null,
  protein_g: null,
  fat_g: null,
  sugar_g: null,
  fiber_g: null,
  sodium_mg: null,
  ...values,
});

describe("carb counting", () => {
  it("without fiber subtracts fiber from the stored carbs", () => {
    expect(shownNutrition(stored, "withoutFiber")).toEqual({ ...stored, carbs_g: 54 });
  });

  it("with fiber shows the stored carbs unchanged", () => {
    expect(shownNutrition(stored, "withFiber")).toEqual(stored);
  });

  it("entered values round-trip to stored form", () => {
    expect(storedNutrition(shownNutrition(stored, "withoutFiber"), "withoutFiber")).toEqual(stored);
    expect(storedNutrition(stored, "withFiber")).toEqual(stored);
  });

  it("missing fiber leaves carbs as they are", () => {
    expect(shownNutrition(only({ carbs_g: 40 }), "withoutFiber").carbs_g).toBe(40);
    expect(storedNutrition(only({ carbs_g: 40 }), "withoutFiber").carbs_g).toBe(40);
  });

  it("fiber above carbs never shows negative carbs", () => {
    expect(shownNutrition(only({ carbs_g: 3, fiber_g: 5 }), "withoutFiber").carbs_g).toBe(0);
  });
});

describe("region default", () => {
  it("counts with fiber in the US and Canada", () => {
    expect(regionDefaultCarbCounting("en-US")).toBe("withFiber");
    expect(regionDefaultCarbCounting("fr-CA")).toBe("withFiber");
  });

  it("counts without fiber elsewhere and when the region is unknown", () => {
    expect(regionDefaultCarbCounting("de-DE")).toBe("withoutFiber");
    expect(regionDefaultCarbCounting("en-GB")).toBe("withoutFiber");
    expect(regionDefaultCarbCounting("en")).toBe("withoutFiber");
    expect(regionDefaultCarbCounting("")).toBe("withoutFiber");
    expect(regionDefaultCarbCounting("not a locale")).toBe("withoutFiber");
  });
});

describe("stored choice", () => {
  beforeEach(() => localStorage.clear());

  it("overrides the region default and survives a reload", () => {
    saveCarbCounting("withFiber");
    expect(localStorage.getItem("carbCounting")).toBe("withFiber");
    expect(currentCarbCounting()).toBe("withFiber");
  });

  it("ignores an unknown stored value", () => {
    localStorage.setItem("carbCounting", "bogus");
    expect(currentCarbCounting()).toBe(regionDefaultCarbCounting());
  });
});
