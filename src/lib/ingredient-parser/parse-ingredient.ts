import type { ParsedIngredient } from "@/types/ingredient.types";

// Unit normalization map (singular, lowercase)
const UNIT_MAP: Record<string, string> = {
  // Volume - English
  cups: "cup",
  cup: "cup",
  c: "cup",
  tablespoons: "tbsp",
  tablespoon: "tbsp",
  tbsp: "tbsp",
  tbs: "tbsp",
  tb: "tbsp",
  teaspoons: "tsp",
  teaspoon: "tsp",
  tsp: "tsp",
  ts: "tsp",
  t: "tsp",
  "fluid ounces": "fl oz",
  "fluid ounce": "fl oz",
  "fl oz": "fl oz",
  floz: "fl oz",
  pints: "pint",
  pint: "pint",
  pt: "pint",
  quarts: "quart",
  quart: "quart",
  qt: "quart",
  gallons: "gallon",
  gallon: "gallon",
  gal: "gallon",
  liters: "l",
  liter: "l",
  litres: "l",
  litre: "l",
  l: "l",
  milliliters: "ml",
  milliliter: "ml",
  millilitres: "ml",
  millilitre: "ml",
  ml: "ml",
  // Weight - English
  pounds: "lb",
  pound: "lb",
  lbs: "lb",
  lb: "lb",
  ounces: "oz",
  ounce: "oz",
  oz: "oz",
  grams: "g",
  gram: "g",
  g: "g",
  kilograms: "kg",
  kilogram: "kg",
  kg: "kg",
  milligrams: "mg",
  milligram: "mg",
  mg: "mg",
  // Count
  pieces: "piece",
  piece: "piece",
  pcs: "piece",
  pc: "piece",
  slices: "slice",
  slice: "slice",
  cloves: "clove",
  clove: "clove",
  heads: "head",
  head: "head",
  bunches: "bunch",
  bunch: "bunch",
  sprigs: "sprig",
  sprig: "sprig",
  stalks: "stalk",
  stalk: "stalk",
  leaves: "leaf",
  leaf: "leaf",
  cans: "can",
  can: "can",
  packages: "package",
  package: "package",
  pkg: "package",
  bags: "bag",
  bag: "bag",
  bottles: "bottle",
  bottle: "bottle",
  jars: "jar",
  jar: "jar",
  // German units
  esslöffel: "tbsp",
  el: "tbsp",
  teelöffel: "tsp",
  tl: "tsp",
  gramm: "g",
  kilogramm: "kg",
  pfund: "lb",
  tasse: "cup",
  tassen: "cup",
  becher: "cup",
  scheiben: "slice",
  scheibe: "slice",
  stück: "piece",
  stücke: "piece",
  zehen: "clove",
  zehe: "clove",
  bund: "bunch",
  dose: "can",
  dosen: "can",
  packung: "package",
  packungen: "package",
  prise: "pinch",
  prisen: "pinch",
};

// Patterns that indicate non-scalable ingredients
const NON_SCALABLE_PATTERNS = [
  /^a\s+pinch\s+of/i,
  /^pinch\s+of/i,
  /^eine?\s+prise/i,
  /to\s+taste$/i,
  /nach\s+geschmack$/i,
  /^some\s+/i,
  /^etwas\s+/i,
  /^a\s+dash\s+of/i,
  /^a\s+splash\s+of/i,
  /^a\s+drizzle\s+of/i,
  /for\s+garnish$/i,
  /zum\s+garnieren$/i,
  /as\s+needed$/i,
  /nach\s+bedarf$/i,
];

// Fraction map for unicode and text fractions
const FRACTION_MAP: Record<string, number> = {
  "½": 0.5,
  "⅓": 0.333,
  "⅔": 0.667,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 0.167,
  "⅚": 0.833,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Preparation words to extract
const PREPARATION_WORDS = [
  "chopped",
  "diced",
  "minced",
  "sliced",
  "grated",
  "shredded",
  "crushed",
  "ground",
  "melted",
  "softened",
  "cubed",
  "julienned",
  "peeled",
  "seeded",
  "cored",
  "trimmed",
  "halved",
  "quartered",
  "beaten",
  "whisked",
  "sifted",
  "packed",
  "loosely packed",
  "firmly packed",
  "room temperature",
  "cold",
  "frozen",
  "thawed",
  "fresh",
  "dried",
  "finely",
  "coarsely",
  "roughly",
  "thinly",
  // German
  "gehackt",
  "gewürfelt",
  "geschnitten",
  "gerieben",
  "zerkleinert",
  "gemahlen",
  "geschmolzen",
  "weich",
  "geschält",
  "entkernt",
  "halbiert",
  "geviertelt",
  "verquirlt",
  "gesiebt",
  "frisch",
  "getrocknet",
  "tiefgekühlt",
  "aufgetaut",
  "fein",
  "grob",
  "dünn",
];

/**
 * Parse a fraction string like "1/2" to a number
 */
function parseFraction(fraction: string): number | null {
  // Handle unicode fractions
  if (FRACTION_MAP[fraction]) {
    return FRACTION_MAP[fraction];
  }

  // Handle text fractions like "1/2"
  const fractionMatch = fraction.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  return null;
}

/**
 * Format a numeric value as a clean decimal display string
 * Rounds to 2 decimal places and strips trailing zeros
 */
function toDecimalDisplay(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === Math.floor(rounded)) {
    return Math.floor(rounded).toString();
  }
  return rounded.toString();
}

/**
 * Extract quantity value and display from a string
 */
function extractQuantity(text: string): {
  value: number | null;
  display: string | null;
  remaining: string;
} {
  const remaining = text.trim();

  // Pattern 1: Range like "2-3" or "2 - 3"
  const rangeMatch = remaining.match(/^(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    const midpoint = (low + high) / 2;
    return {
      value: midpoint,
      display: `${rangeMatch[1]}-${rangeMatch[2]}`,
      remaining: remaining.slice(rangeMatch[0].length).trim(),
    };
  }

  // Pattern 2: Mixed number like "1 1/2" or "1 ½"
  const mixedMatch = remaining.match(/^(\d+)\s+(\d+\/\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const fractionPart = parseFraction(mixedMatch[2]);
    if (fractionPart !== null) {
      const value = whole + fractionPart;
      return {
        value,
        display: toDecimalDisplay(value),
        remaining: remaining.slice(mixedMatch[0].length).trim(),
      };
    }
  }

  // Pattern 3: Single fraction like "1/2" or "½"
  const fractionMatch = remaining.match(/^(\d+\/\d+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/);
  if (fractionMatch) {
    const fractionValue = parseFraction(fractionMatch[1]);
    if (fractionValue !== null) {
      return {
        value: fractionValue,
        display: toDecimalDisplay(fractionValue),
        remaining: remaining.slice(fractionMatch[0].length).trim(),
      };
    }
  }

  // Pattern 4: Decimal or integer like "2.5" or "250"
  const numberMatch = remaining.match(/^(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const value = parseFloat(numberMatch[1]);
    return {
      value,
      display: numberMatch[1],
      remaining: remaining.slice(numberMatch[0].length).trim(),
    };
  }

  // No quantity found
  return {
    value: null,
    display: null,
    remaining,
  };
}

/**
 * Extract unit from the beginning of text
 */
function extractUnit(text: string): {
  unit: string | null;
  unitNormalized: string | null;
  remaining: string;
} {
  const remaining = text.trim();

  // Try to match a unit at the start of the string
  // Sort by length descending to match longer units first (e.g., "fluid ounces" before "fl")
  const unitKeys = Object.keys(UNIT_MAP).sort((a, b) => b.length - a.length);

  for (const unitKey of unitKeys) {
    const regex = new RegExp(`^${unitKey}(?:\\s+|$)`, "i");
    const match = remaining.match(regex);
    if (match) {
      return {
        unit: match[0].trim(),
        unitNormalized: UNIT_MAP[unitKey.toLowerCase()],
        remaining: remaining.slice(match[0].length).trim(),
      };
    }
  }

  // No unit found
  return {
    unit: null,
    unitNormalized: null,
    remaining,
  };
}

/**
 * Extract preparation notes from ingredient text
 */
function extractPreparationNote(text: string): {
  preparationNote: string | null;
  remaining: string;
} {
  let remaining = text;
  const foundPreps: string[] = [];

  // Check for comma-separated preparation notes
  const commaMatch = remaining.match(/,\s*(.+)$/);
  if (commaMatch) {
    const potentialPrep = commaMatch[1].toLowerCase();
    for (const prep of PREPARATION_WORDS) {
      if (potentialPrep.includes(prep.toLowerCase())) {
        foundPreps.push(commaMatch[1].trim());
        remaining = remaining.slice(0, remaining.indexOf(",")).trim();
        break;
      }
    }
  }

  // Check for parenthetical notes like "(chopped)"
  const parenMatch = remaining.match(/\(([^)]+)\)/);
  if (parenMatch) {
    foundPreps.push(parenMatch[1].trim());
    remaining = remaining.replace(parenMatch[0], "").trim();
  }

  return {
    preparationNote: foundPreps.length > 0 ? foundPreps.join(", ") : null,
    remaining,
  };
}

/**
 * Normalize ingredient name for matching
 * Removes common descriptors and standardizes format
 */
function normalizeIngredientName(name: string): string {
  if (!name) return "";

  let normalized = name.toLowerCase().trim();

  // Remove common descriptors
  const descriptors = [
    "fresh",
    "dried",
    "frozen",
    "canned",
    "organic",
    "large",
    "medium",
    "small",
    "ripe",
    "raw",
    "cooked",
    "all-purpose",
    "extra-virgin",
    "virgin",
    "unsalted",
    "salted",
    "whole",
    "ground",
    "crushed",
    "frisch",
    "getrocknet",
    "tiefgekühlt",
    "groß",
    "mittel",
    "klein",
  ];

  for (const descriptor of descriptors) {
    normalized = normalized.replace(new RegExp(`\\b${descriptor}\\b`, "gi"), "");
  }

  // Clean up extra spaces
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Check if ingredient text represents a non-scalable ingredient
 */
function isNonScalable(text: string): boolean {
  return NON_SCALABLE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Remove common filler words like "of" after unit
 */
function removeFillerWords(text: string): string {
  return text.replace(/^(of|vom|von)\s+/i, "").trim();
}

/**
 * Main parsing function
 * Parses an ingredient string like "2 cups all-purpose flour, sifted"
 * into structured data
 */
export function parseIngredient(rawText: string): ParsedIngredient {
  const trimmed = rawText.trim();

  // Check for non-scalable patterns first
  const nonScalable = isNonScalable(trimmed);

  // If non-scalable, return minimal parsing
  if (nonScalable) {
    return {
      quantityValue: null,
      quantityDisplay: null,
      unit: null,
      unitNormalized: null,
      ingredientName: trimmed,
      ingredientNameNormalized: normalizeIngredientName(trimmed),
      preparationNote: null,
      isScalable: false,
    };
  }

  // Extract quantity
  const {
    value: quantityValue,
    display: quantityDisplay,
    remaining: afterQuantity,
  } = extractQuantity(trimmed);

  // Extract unit
  const { unit, unitNormalized, remaining: afterUnit } = extractUnit(afterQuantity);

  // Remove filler words
  const afterFiller = removeFillerWords(afterUnit);

  // Extract preparation notes
  const { preparationNote, remaining: ingredientName } = extractPreparationNote(afterFiller);

  return {
    quantityValue,
    quantityDisplay,
    unit,
    unitNormalized,
    ingredientName: ingredientName || null,
    ingredientNameNormalized: normalizeIngredientName(ingredientName),
    preparationNote,
    isScalable: quantityValue !== null,
  };
}

/**
 * Parse multiple ingredient lines
 */
export function parseIngredients(text: string): ParsedIngredient[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  return lines.map(parseIngredient);
}
