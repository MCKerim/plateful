/**
 * Format a quantity value for display as a decimal
 *
 * @param value - The numeric quantity value
 * @returns Formatted decimal string like "0.5", "1.5", "2", etc.
 *
 * @example
 * formatQuantity(0.5) // "0.5"
 * formatQuantity(1.5) // "1.5"
 * formatQuantity(2) // "2"
 * formatQuantity(2.333) // "2.33"
 * formatQuantity(0.75) // "0.75"
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
