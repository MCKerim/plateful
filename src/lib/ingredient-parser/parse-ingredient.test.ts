import { describe, it, expect } from "vitest";
import { parseIngredient } from "./parse-ingredient";
import fixtures from "./parse-ingredient.fixtures.json";

/**
 * Cross-platform parity contract. `parse-ingredient.fixtures.json` is a copy
 * of the canonical fixture set in the recipe-extractor repo
 * (`src/lib/parse-ingredient.fixtures.json`); the native iOS app asserts the
 * same cases against its Swift port. Any behavioral change to any of the three
 * parsers MUST update the fixtures everywhere — see the PARITY note at the top
 * of parse-ingredient.ts.
 *
 * `ingredientNameNormalized` is deliberately absent from the contract: it is a
 * matching-only field the implementations compute differently by design.
 */
describe("parseIngredient cross-platform fixtures", () => {
  it.each(fixtures.map((f) => [f.input, f] as const))("parses %j", (_, fixture) => {
    const parsed = parseIngredient(fixture.input);
    expect({
      quantityValue: parsed.quantityValue,
      quantityDisplay: parsed.quantityDisplay,
      unit: parsed.unit,
      unitNormalized: parsed.unitNormalized,
      ingredientName: parsed.ingredientName,
      preparationNote: parsed.preparationNote,
      isScalable: parsed.isScalable,
    }).toEqual(fixture.expected);
  });
});
