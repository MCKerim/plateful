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

// Same cases as the extractor's parse-ingredient.test.ts — real rows were
// stored as "e tomaten", "er gemischter salat", "es ei".
describe("parseIngredient normalized name", () => {
  const normalized = (line: string) => parseIngredient(line).ingredientNameNormalized;

  it("drops descriptors as whole words", () => {
    expect(normalized("1 large onion")).toBe("onion");
    expect(normalized("500 g tiefgekühlt Spinat")).toBe("spinat");
    expect(normalized("1 groß Zwiebel")).toBe("zwiebel");
    expect(normalized("2 fresh ripe tomatoes")).toBe("tomatoes");
  });

  it("never cuts a descriptor out of a longer word", () => {
    expect(normalized("2 große Tomaten")).toBe("große tomaten");
    expect(normalized("Großer gemischter Salat")).toBe("großer gemischter salat");
    expect(normalized("1 großes Ei")).toBe("großes ei");
    expect(normalized("1 Großpackung Chips")).toBe("großpackung chips");
    expect(normalized("200 g Süßmittel")).toBe("süßmittel");
    expect(normalized("2 kleine Zwiebeln")).toBe("kleine zwiebeln");
  });
});
