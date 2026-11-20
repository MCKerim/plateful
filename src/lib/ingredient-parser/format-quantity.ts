/**
 * The one rounding rule for a scaled amount, the same in the recipe, cooking
 * mode and the shopping list, for every unit (Kerim, 2026-11-20: "like
 * Chefkoch, at most two decimals, the same everywhere or it confuses"): at most
 * two decimals, half away from zero, so 583.333 g is 583.33 g, 1.125 kg is
 * 1.13 kg and 10.5 eggs stay 10.5. Rounded on the value's shortest spelling,
 * the way the server's `numeric` goes (`private.shopping_round_scaled`): 0.285
 * is 0.29, not the binary 0.28499… rounded down. The native app's
 * `RecipeIngredient.roundScaled` is the same rule.
 */
export function roundQuantity(value: number): number {
  if (!Number.isFinite(value)) return value;
  const magnitude = Math.abs(value);
  // A spelling in exponent form is below 1e-6 (rounds to 0) or a whole number.
  if (String(magnitude).includes("e")) return magnitude < 1 ? 0 : value;
  const rounded = Number(`${Math.round(Number(`${magnitude}e2`))}e-2`);
  return rounded === 0 ? 0 : Math.sign(value) * rounded;
}

/**
 * An amount for display: `roundQuantity`, trailing zeros dropped, no grouping
 * (a grouped "1.000" reads as a decimal in the other language). With a locale
 * it takes that locale's decimal separator ("583,33" in German); without one it
 * writes a point, for text that is stored.
 *
 * @example
 * formatQuantity(2) // "2"
 * formatQuantity(2.333) // "2.33"
 * formatQuantity(1.125, "de") // "1,13"
 */
export function formatQuantity(value: number | null, locale = "en"): string {
  if (value === null) {
    return "";
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    roundQuantity(value)
  );
}

/**
 * Format a quantity for a scaled ingredient, preserving range format if original was a range
 *
 * @param scaledValue - The scaled numeric value
 * @param originalDisplay - The original display string to check for range format
 * @param scaleFactor - The scale factor applied
 * @param locale - The reader's language, for the decimal separator
 * @returns Formatted string
 */
export function formatScaledQuantity(
  scaledValue: number | null,
  originalDisplay: string | null,
  scaleFactor: number,
  locale?: string
): string {
  if (scaledValue === null) {
    return originalDisplay || "";
  }

  // Check if original was a range (e.g., "2-3")
  if (originalDisplay) {
    const rangeMatch = originalDisplay.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1]) * scaleFactor;
      const high = parseFloat(rangeMatch[2]) * scaleFactor;
      return `${formatQuantity(low, locale)}-${formatQuantity(high, locale)}`;
    }
  }

  return formatQuantity(scaledValue, locale);
}

/**
 * Reconstruct the full ingredient text with scaled quantity
 *
 * @param scaledQuantity - The formatted scaled quantity string
 * @param unit - The unit (optional)
 * @param ingredientName - The ingredient name
 * @param preparationNote - Optional preparation note
 * @returns Full ingredient string
 */
export function reconstructIngredientText(
  scaledQuantity: string,
  unit: string | null,
  ingredientName: string | null,
  preparationNote: string | null
): string {
  const parts: string[] = [];

  if (scaledQuantity) {
    parts.push(scaledQuantity);
  }

  if (unit) {
    parts.push(unit);
  }

  if (ingredientName) {
    parts.push(ingredientName);
  }

  let result = parts.join(" ");

  if (preparationNote) {
    result += `, ${preparationNote}`;
  }

  return result;
}
