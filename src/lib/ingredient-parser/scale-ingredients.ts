import type { RecipeIngredient, ScaledIngredient } from "@/types/ingredient.types";
import {
  formatScaledQuantity,
  reconstructIngredientText,
} from "./format-quantity";

/**
 * Scale a single ingredient by a factor
 *
 * @param ingredient - The ingredient to scale
 * @param scaleFactor - The factor to scale by (e.g., 2 for doubling)
 * @returns Scaled ingredient with updated display
 */
export function scaleIngredient(
  ingredient: RecipeIngredient,
  scaleFactor: number
): ScaledIngredient {
  // If ingredient is not scalable or has no quantity, return unchanged
  if (!ingredient.isScalable || ingredient.quantity.value === null) {
    return {
      ...ingredient,
      scaledQuantity: {
        value: ingredient.quantity.value,
        display: ingredient.rawText,
      },
    };
  }

  const scaledValue = ingredient.quantity.value * scaleFactor;
  const scaledDisplay = formatScaledQuantity(
    scaledValue,
    ingredient.quantity.display,
    scaleFactor
  );

  // Reconstruct full text with scaled quantity
  const fullDisplay = reconstructIngredientText(
    scaledDisplay,
    ingredient.unit,
    ingredient.name,
    ingredient.preparationNote
  );

  return {
    ...ingredient,
    scaledQuantity: {
      value: scaledValue,
      display: fullDisplay,
    },
  };
}

/**
 * Scale a list of ingredients
 *
 * @param ingredients - Array of ingredients to scale
 * @param baseServings - The base serving size the recipe was written for
 * @param targetServings - The target serving size
 * @returns Array of scaled ingredients
 */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  baseServings: number,
  targetServings: number
): ScaledIngredient[] {
  // Handle edge cases
  if (baseServings <= 0 || targetServings <= 0) {
    return ingredients.map((ing) => ({
      ...ing,
      scaledQuantity: {
        value: ing.quantity.value,
        display: ing.rawText,
      },
    }));
  }

  // No scaling needed
  if (baseServings === targetServings) {
    return ingredients.map((ing) => ({
      ...ing,
      scaledQuantity: {
        value: ing.quantity.value,
        display: ing.rawText,
      },
    }));
  }

  const scaleFactor = targetServings / baseServings;

  return ingredients.map((ingredient) => scaleIngredient(ingredient, scaleFactor));
}

/**
 * Get just the scaled quantity display for a single ingredient
 * Useful for showing just the quantity portion in UI
 *
 * @param ingredient - The ingredient
 * @param baseServings - Base servings
 * @param targetServings - Target servings
 * @returns The scaled quantity display string
 */
export function getScaledQuantityDisplay(
  ingredient: RecipeIngredient,
  baseServings: number,
  targetServings: number
): string {
  if (!ingredient.isScalable || ingredient.quantity.value === null) {
    return ingredient.quantity.display || "";
  }

  if (baseServings <= 0 || targetServings <= 0 || baseServings === targetServings) {
    return ingredient.quantity.display || "";
  }

  const scaleFactor = targetServings / baseServings;
  const scaledValue = ingredient.quantity.value * scaleFactor;

  return formatScaledQuantity(scaledValue, ingredient.quantity.display, scaleFactor);
}
