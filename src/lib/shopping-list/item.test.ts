import { describe, expect, it } from "vitest";
import type { Json } from "@/types/database.types";
import {
  addTypedAmount,
  dictionaryName,
  itemAmountText,
  isFromRecipe,
  itemTitle,
  originalLine,
  parseDictionaryEntry,
  parseShoppingListItem,
  parseSource,
  parseTypedLine,
  type ShoppingListItemRow,
} from "@/lib/shopping-list/item";
import { amountText, storedAmountText } from "@/lib/shopping-list/amount";
import { makeItem, source } from "@/lib/shopping-list/testItems";

function sources(json: string) {
  return (JSON.parse(json) as Json[]).map(parseSource);
}

function row(overrides: Partial<ShoppingListItemRow>): ShoppingListItemRow {
  return {
    id: "a1",
    name: "Milch",
    quantity_value: null,
    quantity_display: null,
    unit: null,
    ingredient_slug: null,
    category: "other",
    on_list: true,
    added_at: "2026-09-14T10:00:00Z",
    bought_at: null,
    bought_count: 0,
    created_at: "2026-09-14T10:00:00Z",
    created_by: null,
    household_id: "h1",
    name_key: "milch",
    name_custom: false,
    note: null,
    sources: [],
    updated_at: "2026-09-14T10:00:00Z",
    ...overrides,
  };
}

describe("parseSource", () => {
  it("reads a recipe entry written before kinds existed as a recipe", () => {
    const [source] =
      sources(`[{"recipe_id": "r1", "recipe_name": "Lasagne", "recipe_ingredient_id": "i1",
      "quantity_value": 300, "unit": "g", "raw_text": "300 g Tomaten"}]`);
    expect(source?.kind).toBe("recipe");
    expect(source?.recipeName).toBe("Lasagne");
    expect(source?.addedAt).toBeNull();
    expect(source?.addedBy).toBeNull();
    expect(source && itemAmountText(source, "en")).toBe("300 g");
  });

  it("carries who, when and the amount of manual and set entries", () => {
    const [manual, set] = sources(`[{"kind": "manual", "added_at": "2026-09-16T19:00:00Z",
        "added_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "quantity_value": 2, "quantity_display": "2", "unit": null},
      {"kind": "set", "added_at": "2026-09-16T20:00:00Z", "added_by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "quantity_value": null, "quantity_display": null, "unit": null}]`);
    expect([manual?.kind, set?.kind]).toEqual(["manual", "set"]);
    expect(manual?.addedBy).toBe("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
    expect(manual?.addedAt).toBe(1_789_585_200_000);
    expect(manual && itemAmountText(manual, "en")).toBe("2");
    expect(set && itemAmountText(set, "en")).toBe("");
  });

  it("never fails on an unknown kind or a broken field", () => {
    const [source] = sources(
      `[{"kind": "something-new", "recipe_id": "r9", "added_at": "not a date", "added_by": 42}]`
    );
    // Not the recipe's line: the server wouldn't take it off with the recipe.
    expect(source?.kind).toBe("manual");
    expect(source && isFromRecipe(source, "r9")).toBe(false);
    expect(source?.addedAt).toBeNull();
    expect(source?.addedBy).toBeNull();
  });

  it("drops entries that are not objects instead of failing the item", () => {
    const item = parseShoppingListItem(row({ sources: [1, "x", { kind: "manual" }] }));
    expect(item.sources.map((source) => source.kind)).toEqual(["manual"]);
  });
});

describe("parseShoppingListItem", () => {
  it("decodes a row with its aisle and history", () => {
    const item = parseShoppingListItem(
      row({
        quantity_value: 1,
        quantity_display: "1",
        unit: "l",
        ingredient_slug: "milk",
        category: "dairy",
        on_list: false,
        added_at: "2026-09-14T09:00:00Z",
        bought_at: "2026-09-14T11:00:00Z",
        bought_count: 3,
      })
    );
    expect(item).toMatchObject({
      id: "a1",
      name: "Milch",
      quantityValue: 1,
      unit: "l",
      ingredientSlug: "milk",
      aisle: "dairy",
      onList: false,
      boughtCount: 3,
      boughtAt: 1_789_383_600_000,
      createdAt: 1_789_380_000_000,
    });
  });

  it("files an unknown aisle under Other", () => {
    const item = parseShoppingListItem(row({ category: "deli-counter" }));
    expect(item.aisle).toBe("other");
    expect(itemAmountText(item, "en")).toBe("");
  });

  it("decodes a dictionary entry with its name capitalized per language", () => {
    const entry = parseDictionaryEntry({
      slug: "flour",
      name_en: "flour",
      name_de: "Mehl",
      category: "grains",
      is_staple: false,
      names_de: ["Mehl", "Weizenmehl"],
      names_en: ["flour"],
      icon_path: "flour-aea477dc.webp",
    });
    expect(entry?.aisle).toBe("grains");
    expect(entry?.iconPath).toBe("flour-aea477dc.webp");
    expect(entry?.namesDe).toEqual(["Mehl", "Weizenmehl"]);
    expect(entry && dictionaryName(entry, "de")).toBe("Mehl");
    expect(entry && dictionaryName(entry, "en")).toBe("Flour");
  });

  it("lets a dictionary entry without names match on its display names", () => {
    const entry = parseDictionaryEntry({
      slug: "salt",
      name_en: "salt",
      name_de: "Salz",
      category: "spices",
      is_staple: true,
      names_de: null,
      names_en: [],
      icon_path: null,
    });
    expect([entry?.namesDe, entry?.namesEn]).toEqual([["Salz"], ["salt"]]);
    expect(
      parseDictionaryEntry({
        slug: null,
        name_en: "x",
        name_de: "x",
        category: null,
        is_staple: null,
        names_de: null,
        names_en: null,
        icon_path: null,
      })
    ).toBeNull();
  });

  it("decodes the household's rename and note, and a row from before them", () => {
    expect(parseShoppingListItem(row({ name_custom: true, note: "Bio" }))).toMatchObject({
      nameCustom: true,
      note: "Bio",
    });
    const old = parseShoppingListItem({
      ...row({}),
      name_custom: undefined,
      note: undefined,
    } as unknown as ShoppingListItemRow);
    expect([old.nameCustom, old.note]).toEqual([false, null]);
  });
});

describe("title and original lines", () => {
  const typed = (name: string) => ({ ...source("manual", null), name });

  it("follows one wording, takes the product's name for several, keeps a rename", () => {
    const row = makeItem("a", "Jalapeños", "produce", { slug: "jalapeno" });
    expect(
      itemTitle(
        { ...row, sources: [typed("Jalapeños"), typed("jalapeños ")] },
        "Jalapeño",
        new Set()
      )
    ).toBe("Jalapeños");
    expect(
      itemTitle(
        { ...row, sources: [typed("Jalapeños"), typed("eingelegte Jalapeños")] },
        "Jalapeño",
        new Set()
      )
    ).toBe("Jalapeño");
    expect(itemTitle({ ...row, sources: [typed("Peperoni grün")] }, "Jalapeño", new Set())).toBe(
      "Peperoni grün"
    );
    // Folded like the dictionary match: "jalapenos" is the same wording.
    expect(itemTitle({ ...row, sources: [typed("jalapenos")] }, "Jalapeño", new Set())).toBe(
      "Jalapeños"
    );
    expect(
      itemTitle(
        { ...row, nameCustom: true, sources: [typed("Jalapeños"), typed("Chili")] },
        "Jalapeño",
        new Set()
      )
    ).toBe("Jalapeños");
  });

  it("keeps the title with no wordings, no product, or a name another row holds", () => {
    const cookies = makeItem("c", "Kekse", "snacks");
    expect(
      itemTitle({ ...cookies, sources: [typed("Kekse"), typed("Butterkekse")] }, "Keks", new Set())
    ).toBe("Kekse");
    // Entries written before wordings were recorded count as none.
    expect(itemTitle({ ...cookies, sources: [source("recipe", 2)] }, null, new Set())).toBe(
      "Kekse"
    );
    const row = makeItem("a", "Jalapeños", "produce", { slug: "jalapeno" });
    expect(
      itemTitle(
        { ...row, sources: [typed("Jalapeños"), typed("eingelegte Jalapeños")] },
        "Jalapeño",
        new Set(["jalapeño"])
      )
    ).toBe("Jalapeños");
  });

  it("shows recipe lines as written and only typed wordings unlike the title", () => {
    const row = makeItem("a", "Jalapeño", "produce", { slug: "jalapeno" });
    const lines = [
      source(
        "recipe",
        3,
        null,
        { id: "r1", name: "Nachos" },
        { name: "Jalapeño", rawText: "3 Jalapeño, in Ringen" }
      ),
      typed("Peperoni grün"),
      typed("jalapeño "),
      source("set", 7),
    ].map((entry) => originalLine(row, entry));
    // A recipe line shows even where its wording is the title.
    expect(lines).toEqual(["3 Jalapeño, in Ringen", "Peperoni grün", null, null]);
  });

  it("decodes a ledger entry's wording and line as written", () => {
    const [entry] = sources(`[{"kind": "recipe", "recipe_id": "r1", "name": "Sahne",
      "raw_text": "200 ml Schlagsahne", "quantity_value": 200, "unit": "ml"}]`);
    expect([entry?.name, entry?.rawText]).toEqual(["Sahne", "200 ml Schlagsahne"]);
  });
});

describe("amountText", () => {
  it("prefers the written display and formats values", () => {
    expect(amountText(1.5, null, "kg", "de")).toBe("1,5 kg");
    expect(amountText(1.5, "1-2", "kg", "en")).toBe("1-2 kg");
    expect(amountText(1.5, "1-2", null, "en")).toBe("1-2");
  });

  it("gives a decimal display the reader's separator", () => {
    expect(amountText(0.5, "0.5", "tsp", "de")).toBe("0,5 tsp");
    expect(amountText(0.5, "0.5", "tsp", "en")).toBe("0.5 tsp");
    expect(amountText(0.5, "0,5", "TL", "en")).toBe("0.5 TL");
    expect(amountText(0.5, "0,5", "TL", "de")).toBe("0,5 TL");
    // The digits stay as written: no rounding to two decimals, no dropped zero.
    expect(amountText(0.125, "0.125", "tsp", "de")).toBe("0,125 tsp");
    expect(amountText(1.5, "1.50", "kg", "de")).toBe("1,50 kg");
    // The parser stores "1/3" as "0.33" beside 0.3333…: still the value.
    expect(amountText(1 / 3, "0.33", "cup", "de")).toBe("0,33 cup");
    expect(amountText(2 / 3, "0.67", "cup", "de")).toBe("0,67 cup");
    expect(amountText(2, "2", "kg", "de")).toBe("2 kg");
  });

  it.each(["de", "en"])("keeps any other display as written (%s)", (locale) => {
    expect(amountText(0.5, "1/2", "tsp", locale)).toBe("1/2 tsp");
    expect(amountText(2.5, "2-3", null, locale)).toBe("2-3");
    expect(amountText(2.75, "2,5-3", "EL", locale)).toBe("2,5-3 EL");
    expect(amountText(null, "etwas", null, locale)).toBe("etwas");
    expect(amountText(null, "500 g + 2 EL", null, locale)).toBe("500 g + 2 EL");
    expect(amountText(null, "0.5 g + 2.67 EL", null, locale)).toBe("0.5 g + 2.67 EL");
    expect(amountText(null, "0,5 g + 2 EL", null, locale)).toBe("0,5 g + 2 EL");
    expect(amountText(1000, "1.000", "g", locale)).toBe("1.000 g");
    expect(amountText(1000, "1,000", "ml", locale)).toBe("1,000 ml");
    expect(amountText(2, "0.5", null, locale)).toBe("0.5");
    expect(amountText(null, "0.5", null, locale)).toBe("0.5");
    expect(amountText(0.5, ".5", null, locale)).toBe(".5");
    expect(amountText(1.5, "1.5.", null, locale)).toBe("1.5.");
    expect(amountText(1.5, "ca. 1.5", null, locale)).toBe("ca. 1.5");
  });

  it("is shared by sources and typed lines", () => {
    const source = sources(
      `[{"kind": "recipe", "quantity_value": 0.5, "quantity_display": "0.5", "unit": "tsp"}]`
    )[0];
    expect(source && itemAmountText(source, "de")).toBe("0,5 tsp");
    expect(source && itemAmountText(source, "en")).toBe("0.5 tsp");
    const typed = parseTypedLine("0,5 kg Mehl");
    expect(typed?.quantityDisplay).toBe("0,5");
    expect(typed && itemAmountText(typed, "en")).toBe("0.5 kg");
    expect(typed && itemAmountText(typed, "de")).toBe("0,5 kg");
  });
});

describe("addTypedAmount", () => {
  it("mirrors the server's mixed-unit text with displays as stored", () => {
    const flour = addTypedAmount(
      makeItem("a", "Mehl", "grains", { amount: [0.5, "g"], display: "0,5" }),
      { quantityValue: 2, quantityDisplay: "2", unit: "EL" },
      false
    );
    expect(flour.quantityDisplay).toBe("0,5 g + 2 EL");
    expect(flour.quantityValue).toBeNull();
    expect(flour.unit).toBeNull();
    expect(itemAmountText(flour, "en")).toBe("0,5 g + 2 EL");
    expect(itemAmountText(flour, "de")).toBe("0,5 g + 2 EL");

    const butter = addTypedAmount(
      { ...makeItem("b", "Butter", "dairy"), quantityValue: 2.5, unit: "EL" },
      { quantityValue: 0.5, quantityDisplay: "0,5", unit: "kg" },
      false
    );
    expect(butter.quantityDisplay).toBe("2.5 EL + 0,5 kg");

    const pepper = addTypedAmount(
      makeItem("c", "Pfeffer", "spices", { amount: [0.5, "tsp"], display: "0.5" }),
      { quantityValue: 1, quantityDisplay: "1", unit: "Prise" },
      false
    );
    expect(pepper.quantityDisplay).toBe("0.5 tsp + 1 Prise");
    expect(storedAmountText(0.5, "0,5", "g")).toBe("0,5 g");
    expect(storedAmountText(8 / 3, null, "EL")).toBe("2.67 EL");
  });
});
