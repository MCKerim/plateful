import { NutritionValues } from "@/api/nutrition.api";

/**
 * How carbohydrates are counted on screen. The stored `carbs_g` always
 * includes fiber (the US label's total carbohydrate); most other labels, the
 * EU's among them, print carbs without fiber. Both are exact because fiber is
 * stored on its own. Display-only: every write stays in stored form. Mirrors
 * `CarbCounting` in the iOS app's `NutritionFacts.swift`.
 */
export type CarbCounting = "withoutFiber" | "withFiber";

export const CARB_COUNTING_OPTIONS: CarbCounting[] = ["withoutFiber", "withFiber"];

const STORAGE_KEY = "carbCounting";

/**
 * The way this reader's food labels count: with fiber in the US and Canada,
 * without everywhere else, and without when the locale names no region.
 */
export function regionDefaultCarbCounting(
  locale: string | undefined = typeof navigator === "undefined" ? undefined : navigator.language
): CarbCounting {
  if (!locale) return "withoutFiber";
  try {
    const region = new Intl.Locale(locale).region;
    return region === "US" || region === "CA" ? "withFiber" : "withoutFiber";
  } catch {
    return "withoutFiber";
  }
}

/** The reader's choice, or their region's default until they make one. */
export function currentCarbCounting(): CarbCounting {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "withoutFiber" || stored === "withFiber" ? stored : regionDefaultCarbCounting();
}

export function saveCarbCounting(counting: CarbCounting): void {
  localStorage.setItem(STORAGE_KEY, counting);
}

/** These stored values as the reader counts them. */
export function shownNutrition(values: NutritionValues, counting: CarbCounting): NutritionValues {
  const { carbs_g: carbs, fiber_g: fiber } = values;
  if (counting === "withFiber" || carbs === null || fiber === null) return values;
  return { ...values, carbs_g: Math.max(carbs - fiber, 0) };
}

/** Values entered the way the reader counts them, back in stored form. */
export function storedNutrition(values: NutritionValues, counting: CarbCounting): NutritionValues {
  const { carbs_g: carbs, fiber_g: fiber } = values;
  if (counting === "withFiber" || carbs === null || fiber === null) return values;
  return { ...values, carbs_g: carbs + fiber };
}
