import type { ParsedIngredient } from "@/types/ingredient.types";

// PARITY: this parser exists three times — here (web/Capacitor editor), in the
// recipe-extractor repo (`src/lib/parse-ingredient.ts`, canonical: parses every
// import), and as a Swift port in the native iOS app
// (`plateful/Core/IngredientParser.swift`). All three must produce identical
// rows. Any behavioral change MUST update the shared fixture contract
// (`parse-ingredient.fixtures.json`, canonical copy in the extractor repo) in
// every repo and keep all three test suites green.

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
  messerspitze: "pinch",
  msp: "pinch",
  kelle: "ladle",
  kellen: "ladle",
  schuss: "dash",
  spritzer: "splash",
  handvoll: "handful",
  päckchen: "package",
  pck: "package",
  stk: "piece",
  stange: "stalk",
  stangen: "stalk",
  zweig: "sprig",
  zweige: "sprig",
  blatt: "leaf",
  blätter: "leaf",
  würfel: "cube",
  glas: "glass",
  gläser: "glass",
  tropfen: "drop",
  kopf: "head",
  köpfe: "head",
  stiel: "sprig",
  stiele: "sprig",
  kugel: "ball",
  kugeln: "ball",
  flasche: "bottle",
  flaschen: "bottle",
  messlöffel: "scoop",
  beutel: "bag",
  tüte: "bag",
  tüten: "bag",
  riegel: "bar",
  rolle: "roll",
  rollen: "roll",
  knolle: "bulb",
  knollen: "bulb",
  // Count/measure words missing from the English section above
  pinch: "pinch",
  pinches: "pinch",
  dash: "dash",
  dashes: "dash",
  splash: "splash",
  splashes: "splash",
  handful: "handful",
  handfuls: "handful",
  drop: "drop",
  drops: "drop",
  stick: "stick",
  sticks: "stick",
  scoop: "scoop",
  scoops: "scoop",
};

// Unit matchers, precompiled once at module load (not per ingredient). Sorted
// longest-key-first so multi-word units like "fluid ounces" match before short
// ones like "fl"; each key compiles to an anchored regex reused on every call.
// Abbreviations are often written with a trailing period ("EL.", "Msp."), so
// every key tolerates an optional "." before the word boundary.
const UNIT_MATCHERS: { regex: RegExp; normalized: string }[] = Object.keys(UNIT_MAP)
  .sort((a, b) => b.length - a.length)
  .map((key) => ({
    regex: new RegExp(`^${key}\\.?(?:\\s+|$)`, "i"),
    normalized: UNIT_MAP[key]!,
  }));

// A line that opens like this is not an amount to scale, even with a number in
// it. A phrase at the end ("to taste", "nach Geschmack", "for garnish") is not
// in this list: "1 Prise Salz, nach Geschmack" is 1 Prise Salz with a note.
const NON_SCALABLE_PATTERNS = [
  /^a\s+pinch\s+of/i,
  /^pinch\s+of/i,
  /^some\s+/i,
  /^etwas\s+/i,
  /^a\s+dash\s+of/i,
  /^a\s+splash\s+of/i,
  /^a\s+drizzle\s+of/i,
];

// Approximation words before a number ("ca. 200 g") carry no amount of their own.
const QUANTITY_PREFIX = /^(?:ca\.|approx\.|(?:ca|etwa|circa|about|approx)\s)\s*/i;

// A standalone leading word as the quantity ("eine Prise", "zwei Eier"). English
// "a"/"an" are left alone: "a cup of milk" reads as a phrase, not as 1.
const WORD_NUMBERS: Record<string, number> = {
  "einen halben": 0.5,
  "eine halbe": 0.5,
  "ein halber": 0.5,
  "ein halbes": 0.5,
  "a half": 0.5,
  "half an": 0.5,
  "half a": 0.5,
  ein: 1,
  eine: 1,
  einen: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  halbe: 0.5,
  halber: 0.5,
  halbes: 0.5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  half: 0.5,
};

// "ein paar" / "ein bisschen" / "ein wenig" mean "a few" / "a little", not 1;
// "half and half" and "five spice" are names.
const WORD_NUMBER_MATCHERS = Object.keys(WORD_NUMBERS)
  .sort((a, b) => b.length - a.length)
  .map((key) => ({
    regex: new RegExp(`^${key}(?=\\s|$)(?!\\s+(?:paar|bisschen|wenig|and|spice)(?:\\s|$))`, "i"),
    value: WORD_NUMBERS[key]!,
  }));

// Adjectives that qualify a spoon or cup measure ("2 gehäufte EL"); they sit
// between the number and the unit and move to the note.
const MEASURE_ADJECTIVE =
  /^(gehäuft\p{L}*|gestrichen\p{L}*|knapp\p{L}*|gut\p{L}*|heaped|heaping|level|scant|generous|rounded)\s+/iu;
const SPOON_OR_CUP_UNITS = new Set(["tbsp", "tsp", "cup"]);

// On a line without a number, a leading "etwas" is the quantity display. A
// trailing "nach Geschmack" goes to the note: as an amount it would land on
// the shopping list ("500 g + nach Geschmack").
const VAGUE_AMOUNT_LEADING = /^(etwas)\s+/i;
const VAGUE_AMOUNT_TRAILING = /(?:^|,?\s+)(nach Geschmack|nach Belieben|nach Bedarf|to taste|as needed)$/i;

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

/**
 * Parse a fraction string like "1/2" to a number
 */
function parseFraction(fraction: string): number | null {
  // Handle unicode fractions
  const unicode = FRACTION_MAP[fraction];
  if (unicode !== undefined) {
    return unicode;
  }

  // Handle text fractions like "1/2"
  const fractionMatch = fraction.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]!, 10);
    const denominator = parseInt(fractionMatch[2]!, 10);
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
 * Parse a numeric token that may use a decimal point ("1.5"), a German decimal
 * comma ("1,5"), or a thousands separator ("1.000" German / "1,000" English).
 * A separator followed by exactly three zeros reads as thousands — recipes
 * never state quantities to three-zero decimal precision, but "1.000 g" and
 * "1,000 ml" genuinely mean a thousand.
 */
function parseNumericToken(token: string): number {
  const thousands = token.match(/^(\d+)[.,]000$/);
  if (thousands) {
    return parseInt(thousands[1]!, 10) * 1000;
  }
  return parseFloat(token.replace(",", "."));
}

/**
 * Extract quantity value and display from a string
 */
export function extractQuantity(text: string): {
  value: number | null;
  display: string | null;
  remaining: string;
} {
  const original = text.trim();
  const remaining = original.replace(QUANTITY_PREFIX, "");

  // Pattern 1: Range like "2-3" or "2 - 3"
  const rangeMatch = remaining.match(/^(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/);
  if (rangeMatch) {
    const low = parseNumericToken(rangeMatch[1]!);
    const high = parseNumericToken(rangeMatch[2]!);
    const midpoint = (low + high) / 2;
    return {
      value: midpoint,
      display: `${rangeMatch[1]}-${rangeMatch[2]}`,
      remaining: remaining.slice(rangeMatch[0].length).trim(),
    };
  }

  // Pattern 2: Mixed number like "1 1/2", "1 ½" or "1½" (only a glyph may
  // touch the whole number: "11/2" is eleven halves, not 1 + 1/2)
  const mixedMatch = remaining.match(/^(\d+)(\s+\d+\/\d+|\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]!, 10);
    const fractionPart = parseFraction(mixedMatch[2]!.trim());
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
    const fractionValue = parseFraction(fractionMatch[1]!);
    if (fractionValue !== null) {
      return {
        value: fractionValue,
        display: toDecimalDisplay(fractionValue),
        remaining: remaining.slice(fractionMatch[0].length).trim(),
      };
    }
  }

  // Pattern 4: Decimal or integer like "2.5", "2,5", or "250". The display
  // keeps the source spelling ("1,5" stays "1,5" for German recipes); only the
  // numeric value is normalized.
  const numberMatch = remaining.match(/^(\d+(?:[.,]\d+)?)/);
  if (numberMatch) {
    const value = parseNumericToken(numberMatch[1]!);
    return {
      value,
      display: numberMatch[1]!,
      remaining: remaining.slice(numberMatch[0].length).trim(),
    };
  }

  // Pattern 5: Word number like "eine" or "two"
  for (const { regex, value } of WORD_NUMBER_MATCHERS) {
    const wordMatch = remaining.match(regex);
    if (wordMatch) {
      return {
        value,
        display: toDecimalDisplay(value),
        remaining: remaining.slice(wordMatch[0].length).trim(),
      };
    }
  }

  // No quantity found
  return {
    value: null,
    display: null,
    remaining: original,
  };
}

/**
 * Extract unit from the beginning of text
 */
export function extractUnit(text: string): {
  unit: string | null;
  unitNormalized: string | null;
  remaining: string;
} {
  const remaining = text.trim();

  // Match a unit at the start of the string using the precompiled, longest-first
  // matchers (so "fluid ounces" wins over "fl").
  for (const { regex, normalized } of UNIT_MATCHERS) {
    const match = remaining.match(regex);
    if (match) {
      return {
        // Strip the optional abbreviation period ("EL." → "EL") — the dot is
        // punctuation of the source line, not part of the unit.
        unit: match[0].trim().replace(/\.$/, ""),
        unitNormalized: normalized,
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
function extractPreparationNote(
  text: string,
  hasQuantity: boolean,
): {
  preparationNote: string | null;
  remaining: string;
} {
  let remaining = text;
  const foundPreps: string[] = [];

  // Everything after the first comma is a preparation/state note ("Champignons,
  // in Scheiben", "Pasta, ungekocht", "Zitrone, Saft") — no word whitelist; a
  // mis-filed tail still renders as the small note line instead of polluting
  // the name. Two guards, both from real library data: only quantified lines
  // are split (an unquantified "Salz, Pfeffer, Paprikapulver" is an
  // enumeration, not a name plus note), and a digit-flanked comma is a decimal
  // ("Joghurt 1,5%"), never a note boundary.
  if (hasQuantity) {
    for (let i = remaining.indexOf(","); i !== -1; i = remaining.indexOf(",", i + 1)) {
      const isDecimal =
        /\d/.test(remaining[i - 1] ?? "") && /\d/.test(remaining[i + 1] ?? "");
      const before = remaining.slice(0, i);
      const insideParens = before.split("(").length > before.split(")").length;
      if (i === 0 || isDecimal || insideParens) continue;
      const tail = remaining.slice(i + 1).trim();
      if (tail) {
        foundPreps.push(tail);
      }
      remaining = remaining.slice(0, i).trim();
      break;
    }
  }

  // Check for parenthetical notes like "(chopped)"
  const parenMatch = remaining.match(/\(([^)]+)\)/);
  if (parenMatch) {
    foundPreps.push(parenMatch[1]!.trim());
    remaining = remaining.replace(parenMatch[0]!, "").trim();
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
export function normalizeIngredientName(name: string): string {
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

  // Whole words only, with letter-aware boundaries: JS `\b` is ASCII-only, so
  // "ß" and umlauts count as non-word characters — `\bgroß\b` matched exactly
  // when a letter followed ("große tomaten" → "e tomaten") and never the bare
  // word.
  for (const descriptor of descriptors) {
    normalized = normalized.replace(
      new RegExp(`(?<![\\p{L}\\p{N}_])${descriptor}(?![\\p{L}\\p{N}_])`, "giu"),
      "",
    );
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
  const text = rawText.replace(/\s{2,}/g, " ");
  // "(optional)" and a trailing ", optional" go; "(optional, zum Servieren)" keeps its rest.
  const line = text.replace(OPTIONAL_ALONE, "").replace(OPTIONAL_LEADING, "(");
  return { ...parseLine(line), isOptional: line !== text };
}

const OPTIONAL_ALONE = /\s*\(\s*optional\s*\)|\s*,\s*optional\s*$/gi;
const OPTIONAL_LEADING = /\(\s*optional\s*[,;]\s*/gi;

function parseLine(rawText: string): Omit<ParsedIngredient, "isOptional"> {
  const trimmed = rawText.trim();

  const quantity = extractQuantity(trimmed);
  const quantityValue = quantity.value;
  let quantityDisplay = quantity.display;
  let afterQuantity = quantity.remaining;

  // A non-scalable line with a number ("a pinch of salt") keeps the whole line
  // as the name; one without a number is parsed like any other line.
  if (quantityValue !== null && isNonScalable(trimmed)) {
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

  let vagueNote: string | null = null;
  // With a number the phrase is only taken off a line without a comma
  // ("1 TL Chili nach Geschmack"); after a comma it already is the note.
  if (quantityValue === null || !afterQuantity.includes(",")) {
    const leading = quantityValue === null ? afterQuantity.match(VAGUE_AMOUNT_LEADING) : null;
    const trailing = leading ? null : afterQuantity.match(VAGUE_AMOUNT_TRAILING);
    if (leading) {
      quantityDisplay = leading[1]!;
      afterQuantity = afterQuantity.slice(leading[0].length).trim();
    } else if (trailing) {
      vagueNote = trailing[1]!;
      afterQuantity = afterQuantity.slice(0, trailing.index).trim();
    }
  }

  // Extract unit
  let { unit, unitNormalized, remaining: afterUnit } = extractUnit(afterQuantity);
  let measureAdjective: string | null = null;
  const adjective = quantityValue !== null && !unit ? afterQuantity.match(MEASURE_ADJECTIVE) : null;
  if (adjective) {
    const measured = extractUnit(afterQuantity.slice(adjective[0].length));
    if (measured.unitNormalized && SPOON_OR_CUP_UNITS.has(measured.unitNormalized)) {
      ({ unit, unitNormalized, remaining: afterUnit } = measured);
      measureAdjective = adjective[1]!;
    }
  }

  // Remove filler words
  const afterFiller = removeFillerWords(afterUnit);

  // Extract preparation notes
  const { preparationNote: note, remaining: ingredientName } = extractPreparationNote(
    afterFiller,
    quantityValue !== null,
  );
  const preparationNote = [measureAdjective, note, vagueNote].filter(Boolean).join(", ") || null;

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
