/**
 * Common fractions and their decimal equivalents
 * Sorted by proximity to the value for best matching
 */
const COMMON_FRACTIONS: Array<{ value: number; display: string }> = [
  { value: 0.125, display: "1/8" },
  { value: 0.167, display: "1/6" },
  { value: 0.2, display: "1/5" },
  { value: 0.25, display: "1/4" },
  { value: 0.333, display: "1/3" },
  { value: 0.375, display: "3/8" },
  { value: 0.4, display: "2/5" },
  { value: 0.5, display: "1/2" },
  { value: 0.6, display: "3/5" },
  { value: 0.625, display: "5/8" },
  { value: 0.667, display: "2/3" },
  { value: 0.75, display: "3/4" },
  { value: 0.8, display: "4/5" },
  { value: 0.833, display: "5/6" },
  { value: 0.875, display: "7/8" },
];

/**
 * Tolerance for matching fractions (5%)
 */
const FRACTION_TOLERANCE = 0.05;

/**
 * Find the closest common fraction to a decimal value
 */
function findClosestFraction(decimal: number): string | null {
  for (const fraction of COMMON_FRACTIONS) {
    if (Math.abs(decimal - fraction.value) <= FRACTION_TOLERANCE) {
      return fraction.display;
    }
  }
  return null;
}

/**
 * Format a quantity value for display
 *
 * @param value - The numeric quantity value
 * @param originalDisplay - The original display string (if available, to preserve format)
 * @returns Formatted string like "1/2", "1 1/2", "2", etc.
 *
 * @example
 * formatQuantity(0.5) // "1/2"
 * formatQuantity(1.5) // "1 1/2"
 * formatQuantity(2) // "2"
 * formatQuantity(2.333) // "2 1/3"
 * formatQuantity(0.75) // "3/4"
 */
export function formatQuantity(value: number | null): string {
  if (value === null) {
    return "";
  }

  // Handle zero
  if (value === 0) {
    return "0";
  }

  // Handle negative (shouldn't happen but just in case)
  if (value < 0) {
    return value.toString();
  }

  const wholePart = Math.floor(value);
  const fractionalPart = value - wholePart;

  // If it's a whole number
  if (fractionalPart < 0.01) {
    return wholePart.toString();
  }

  // If fractional part is very close to 1, round up
  if (fractionalPart > 0.99) {
    return (wholePart + 1).toString();
  }

  // Try to find a matching common fraction
  const fractionDisplay = findClosestFraction(fractionalPart);

  if (fractionDisplay) {
    if (wholePart === 0) {
      return fractionDisplay;
    }
    return `${wholePart} ${fractionDisplay}`;
  }

  // No common fraction found - use decimal
  // Round to 2 decimal places for cleaner display
  const rounded = Math.round(value * 100) / 100;

  // If it rounds to a whole number, display as whole
  if (rounded === Math.floor(rounded)) {
    return Math.floor(rounded).toString();
  }

  // Remove trailing zeros
  return rounded.toString();
}

/**
 * Format a quantity for a scaled ingredient, preserving range format if original was a range
 *
 * @param scaledValue - The scaled numeric value
 * @param originalDisplay - The original display string to check for range format
 * @param scaleFactor - The scale factor applied
 * @returns Formatted string
 */
export function formatScaledQuantity(
  scaledValue: number | null,
  originalDisplay: string | null,
  scaleFactor: number
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
      return `${formatQuantity(low)}-${formatQuantity(high)}`;
    }
  }

  return formatQuantity(scaledValue);
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
