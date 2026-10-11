import { describe, expect, it } from "vitest";
import {
  addLine,
  addsNothing,
  aisleSections,
  editItem,
  editProblem,
  markBought,
  previewItem,
  previewLine,
  previewName,
  putBack,
  recentlyBought,
  removeRecipe,
  suggestionItem,
  suggestions,
  tripRecipes,
} from "@/lib/shopping-list/list";
import {
  isFromRecipe,
  itemAmountText,
  keeping,
  parseTypedLine,
  type ShoppingDictionaryEntry,
  type ShoppingListItem,
  type TypedLine,
} from "@/lib/shopping-list/item";
import type { ShoppingAisle } from "@/lib/shopping-list/aisle";
import { makeItem, source } from "@/lib/shopping-list/testItems";

const ME = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function entry(
  slug: string,
  nameEn: string,
  nameDe: string,
  aisle: ShoppingAisle
): ShoppingDictionaryEntry {
  return { slug, nameEn, nameDe, aisle, isStaple: false };
}

function line(text: string): TypedLine {
  const parsed = parseTypedLine(text);
  if (!parsed) throw new Error(`blank line: ${text}`);
  return parsed;
}

function preview(items: ShoppingListItem[], dictionary: ShoppingDictionaryEntry[], text: string) {
  return previewLine(items, dictionary, line(text));
}

function suggest(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  text: string,
  language: string
) {
  const typed = parseTypedLine(text);
  return typed
    ? suggestions(items, dictionary, previewLine(items, dictionary, typed), language)
    : [];
}

/** The store's `add(text:)`: the list after the line, unchanged when it adds nothing. */
function add(
  items: ShoppingListItem[],
  text: string,
  now = 0,
  dictionary: ShoppingDictionaryEntry[] = []
) {
  return (
    addLine(items, dictionary, line(text), { newId: `new-${text}`, now, userId: ME })?.items ??
    items
  );
}

function edit(
  items: ShoppingListItem[],
  id: string,
  name: string,
  amountText: string | null,
  aisle: ShoppingAisle
) {
  return items.map((item) => (item.id === id ? editItem(item, { name, amountText, aisle }) : item));
}

const text = (item: ShoppingListItem | undefined) =>
  item ? itemAmountText(item, "en") : undefined;

describe("the list", () => {
  it("follows the store walk and shows only what is on the list", () => {
    const sections = aisleSections([
      makeItem("a", "Salt", "spices"),
      makeItem("b", "Milk", "dairy", { order: 2 }),
      makeItem("c", "Onions", "produce"),
      makeItem("d", "Cream", "dairy", { order: 1 }),
      makeItem("e", "Toilet paper", "household"),
      makeItem("f", "Eggs", "dairy", { onList: false, bought: 3, boughtAt: 500 }),
    ]);
    expect(sections.map((section) => section.aisle)).toEqual([
      "produce",
      "dairy",
      "spices",
      "household",
    ]);
    expect(sections[1].items.map((item) => item.name)).toEqual(["Cream", "Milk"]);
  });

  it("keeps the amount when buying and brings it along when putting back", () => {
    const milk = makeItem("a", "Milk", "dairy", {
      amount: [1, "l"],
      sources: [source("recipe", 1, "l", { id: "pancakes", name: "Pancakes" })],
    });
    let items = markBought([milk], "a", 500);
    expect(aisleSections(items)).toEqual([]);
    const bought = recentlyBought(items)[0];
    expect(bought.boughtAt).toBe(500);
    expect(bought.boughtCount).toBe(1);
    expect(text(bought)).toBe("1 l");
    expect(bought.sources).toEqual([]);
    items = putBack(items, "a", 600, ME);
    expect(recentlyBought(items)).toEqual([]);
    const back = aisleSections(items)[0].items[0];
    expect(back.addedAt).toBe(600);
    expect(text(back)).toBe("1 l");
    // One manual entry carries the amount, so the ledger replays to it.
    expect(back.sources.map((entry) => entry.kind)).toEqual(["manual"]);
    expect(text(keeping(back, () => true))).toBe("1 l");
    expect(tripRecipes(aisleSections(items))).toEqual([]);
  });

  it("brings a bought item typed again back with exactly the typed amount", () => {
    let items = [
      makeItem("a", "Äpfel", "produce", {
        onList: false,
        bought: 3,
        boughtAt: 10,
        amount: [4, null],
      }),
      makeItem("b", "Birnen", "produce", {
        onList: false,
        bought: 1,
        boughtAt: 10,
        amount: [3, null],
      }),
    ];
    items = add(items, "Äpfel", 20);
    expect(items[0].onList).toBe(true);
    expect(text(items[0])).toBe("");
    expect(items[0].sources).toHaveLength(1);
    // A fresh trip: the typed 2 replace the last 3 rather than add to them.
    items = add(items, "2 Birnen", 20);
    expect(items[1].onList).toBe(true);
    expect(text(items[1])).toBe("2");
  });

  it("brings a bought item back with an amount edited meanwhile", () => {
    let items = [
      makeItem("a", "Milch", "dairy", { onList: false, bought: 5, boughtAt: 10, amount: [1, "l"] }),
    ];
    items = edit(items, "a", "Milch", "2 l", "dairy");
    expect(text(recentlyBought(items)[0])).toBe("2 l");
    items = putBack(items, "a", 20, ME);
    expect(text(items[0])).toBe("2 l");
  });

  it("lists recently bought newest first and at most twenty", () => {
    const items = Array.from({ length: 25 }, (_, n) =>
      makeItem(`b${n}`, `Item ${n}`, "other", { onList: false, bought: 1, boughtAt: n })
    );
    items.push(makeItem("never", "Never bought", "other", { onList: false }));
    const recent = recentlyBought(items);
    expect(recent).toHaveLength(20);
    expect(recent[0].id).toBe("b24");
    expect(recent[19].id).toBe("b5");
    expect(recent.some((item) => item.id === "never")).toBe(false);
  });

  it("adds nothing for a name already on the list", () => {
    const items = [makeItem("a", "Milch", "dairy")];
    expect(addLine(items, [], line("milch"), { newId: "x", now: 0, userId: ME })).toBeNull();
  });

  it("puts a bought item back when typed and adds typed amounts up", () => {
    let items = [makeItem("a", "Äpfel", "produce", { onList: false, bought: 4, boughtAt: 100 })];
    items = add(items, "10 Äpfel", 700);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      onList: true,
      addedAt: 700,
      quantityValue: 10,
      boughtCount: 4,
    });
    // Typing the name again while it is on the list keeps this trip's amount.
    items = add(items, "Äpfel");
    expect(items[0].quantityValue).toBe(10);
    // Two more for work: 12, not 2.
    items = add(items, "2 Äpfel");
    expect(items[0].quantityValue).toBe(12);
    expect(text(items[0])).toBe("12");
    // A different unit can't be summed; both stay readable.
    items = add(items, "1 kg Äpfel");
    expect(items[0].quantityValue).toBeNull();
    expect(text(items[0])).toBe("12 + 1 kg");
    expect(items).toHaveLength(1);
  });

  it("sets name, amount and aisle outright when editing", () => {
    let items = [
      makeItem("a", "Äpfel", "produce", { amount: [12, null] }),
      makeItem("b", "Milch", "dairy"),
    ];
    items = edit(items, "a", "Bio-Äpfel", "3 kg", "other");
    expect(items[0]).toMatchObject({
      name: "Bio-Äpfel",
      quantityValue: 3,
      unit: "kg",
      aisle: "other",
    });
    items = edit(items, "a", "Bio-Äpfel", "2 Packungen", "produce");
    expect(text(items[0])).toBe("2 Packungen");
    items = edit(items, "a", "Bio-Äpfel", "", "produce");
    expect(text(items[0])).toBe("");
    // A name the household already has, or none, is refused before anything changes.
    expect(editProblem(items, "a", "milch")).toBe("duplicateName");
    expect(editProblem(items, "a", "  ")).toBe("nameRequired");
    expect(editProblem(items, "a", "Bio-Äpfel")).toBeNull();
  });

  it("keeps the amount unrounded when an edit leaves it alone", () => {
    const items = edit(
      [makeItem("a", "Butter", "dairy", { amount: [8 / 3, "EL"] })],
      "a",
      "Butter",
      null,
      "other"
    );
    expect(items[0]).toMatchObject({ aisle: "other", quantityValue: 8 / 3, unit: "EL" });
  });

  it("writes the ledger entry of typed lines and put-backs at once", () => {
    let items = [makeItem("a", "Milch", "dairy", { onList: false, bought: 1, boughtAt: 10 })];
    items = putBack(items, "a", 20, ME);
    expect(items[0].sources).toMatchObject([
      { kind: "manual", addedBy: ME, addedAt: 20, quantityValue: null },
    ]);
    items = add(items, "2 l Milch", 30);
    expect(items[0].sources).toHaveLength(2);
    expect(items[0].sources[1].quantityValue).toBe(2);
    // The ledger replays to the amount on the row.
    expect(text(keeping(items[0], () => true))).toBe(text(items[0]));
    items = add(items, "3 Zitronen", 40);
    const lemons = items[items.length - 1];
    expect(lemons.sources.map((entry) => entry.kind)).toEqual(["manual"]);
    expect(lemons.sources[0].quantityValue).toBe(3);
  });

  it("makes a new name a new item under Other", () => {
    const items = add([], "500 g Mehl");
    expect(items[0]).toMatchObject({
      name: "Mehl",
      quantityValue: 500,
      unit: "g",
      aisle: "other",
      onList: true,
      boughtCount: 0,
    });
    expect(parseTypedLine("   ")).toBeNull();
  });

  it("matches the dictionary with umlauts folded, like the server", () => {
    const dictionary = [
      entry("apple", "apple", "Apfel", "produce"),
      entry("tissue", "tissue", "Taschentuch", "care"),
    ];
    expect(preview([], dictionary, "10 Äpfel")).toMatchObject({ slug: "apple", aisle: "produce" });
    expect(preview([], dictionary, "Taschentücher")).toMatchObject({ slug: "tissue", aisle: "care" });
    const items = [makeItem("a", "Apfel", "produce", { slug: "apple" })];
    expect(addsNothing(preview(items, dictionary, "Äpfel"))).toBe(true);
  });

  it("holds an edited aisle across buying and putting back", () => {
    let items = edit([makeItem("a", "Klopapier", "other")], "a", "Klopapier", "", "household");
    expect(aisleSections(items).map((section) => section.aisle)).toEqual(["household"]);
    items = putBack(markBought(items, "a", 1), "a", 2, ME);
    expect(aisleSections(items).map((section) => section.aisle)).toEqual(["household"]);
  });

  it("parses an edited prefill back to the same amount", () => {
    const pepper = makeItem("a", "Pfeffer", "spices", { amount: [0.5, "tsp"], display: "0.5" });
    expect(itemAmountText(pepper, "de")).toBe("0,5 tsp");
    expect(edit([pepper], "a", "Pfeffer", null, "spices")[0].quantityDisplay).toBe("0.5");
    const retyped = edit([pepper], "a", "Pfeffer", "0,5 TL", "spices")[0];
    expect(retyped.quantityValue).toBe(0.5);
    expect(retyped.unit).toBe("TL");
  });
});

describe("recipes on the trip", () => {
  const fromRecipe = (
    id: string,
    name: string,
    value: number | null,
    unit: string | null = null,
    at = 0
  ) => source("recipe", value, unit, { id, name, at });
  const byHand = (value: number | null, unit: string | null = null) =>
    source("manual", value, unit);

  it("lists the last added first with their items in walk order", () => {
    const items = [
      makeItem("a", "Spaghetti", "grains", {
        amount: [500, "g"],
        sources: [
          fromRecipe("lasagne", "Lasagne", 250, "g", 100),
          fromRecipe("carbonara", "Carbonara", 250, "g", 200),
        ],
      }),
      makeItem("b", "Tomaten", "produce", {
        amount: [300, "g"],
        sources: [fromRecipe("lasagne", "Lasagne", 300, "g", 100)],
      }),
      makeItem("c", "Milch", "dairy", { sources: [byHand(null)] }),
      makeItem("d", "Eier", "dairy", {
        onList: false,
        bought: 1,
        boughtAt: 50,
        sources: [fromRecipe("omelette", "Omelette", 3)],
      }),
    ];
    const trip = tripRecipes(aisleSections(items));
    expect(items.filter((item) => item.onList)).toHaveLength(3);
    expect(trip.map((recipe) => recipe.name)).toEqual(["Carbonara", "Lasagne"]);
    expect(trip[1].items.map((item) => item.name)).toEqual(["Tomaten", "Spaghetti"]);
    expect(trip[1].addedAt).toBe(100);
  });

  it("counts a recipe added twice as one card with both adds, and removing takes both", () => {
    const tomatoes = makeItem("a", "Tomaten", "produce", {
      amount: [800, "g"],
      sources: [
        fromRecipe("lasagne", "Lasagne", 300, "g", 100),
        byHand(200, "g"),
        fromRecipe("lasagne", "Lasagne", 300, "g", 500),
      ],
    });
    const sheets = makeItem("b", "Lasagneplatten", "grains", {
      amount: [2, "Packung"],
      sources: [
        fromRecipe("lasagne", "Lasagne", 1, "Packung", 100),
        fromRecipe("lasagne", "Lasagne", 1, "Packung", 500),
      ],
    });
    const trip = tripRecipes(aisleSections([tomatoes, sheets]));
    expect(trip).toHaveLength(1);
    expect(trip[0]).toMatchObject({ timesAdded: 2, addedAt: 500 });
    expect(trip[0].items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(text(keeping(tomatoes, (entry) => isFromRecipe(entry, "lasagne")))).toBe("600 g");
    const { items, keptIds, touchedCount } = removeRecipe([tomatoes, sheets], "lasagne");
    expect(touchedCount).toBe(2);
    expect(tripRecipes(aisleSections(items))).toEqual([]);
    expect(items.map((item) => item.id)).toEqual(["a"]);
    expect(keptIds).toEqual(["a"]);
    expect(text(items[0])).toBe("200 g");
  });

  it("takes off a recipe's amounts and only what nothing else needs", () => {
    const cream = makeItem("f", "Sahne", "dairy", {
      amount: [200, "ml"],
      sources: [fromRecipe("carbonara", "Carbonara", 200, "ml")],
    });
    const before = [
      makeItem("a", "Tomaten", "produce", {
        amount: [500, "g"],
        sources: [fromRecipe("lasagne", "Lasagne", 300, "g"), byHand(200, "g")],
      }),
      makeItem("b", "Lasagneplatten", "grains", {
        amount: [1, "Packung"],
        sources: [fromRecipe("lasagne", "Lasagne", 1, "Packung")],
      }),
      makeItem("c", "Zwiebeln", "produce", {
        bought: 5,
        boughtAt: 40,
        amount: [2, null],
        sources: [fromRecipe("lasagne", "Lasagne", 2)],
      }),
      {
        ...makeItem("d", "Mehl", "grains", {
          sources: [
            byHand(1, "kg"),
            fromRecipe("lasagne", "Lasagne", 2, "EL"),
            fromRecipe("bread", "Brot", 500, "g"),
          ],
        }),
        quantityDisplay: "1 kg + 2 EL",
      },
      makeItem("e", "Knoblauch", "produce", {
        amount: [3, "Zehen"],
        sources: [fromRecipe("lasagne", "Lasagne", 2, "Zehen"), source("set", 3, "Zehen")],
      }),
      cream,
    ];
    const { items } = removeRecipe(before, "lasagne");
    const byId = (id: string) => items.find((item) => item.id === id);
    expect(tripRecipes(aisleSections(items)).map((recipe) => recipe.name)).toEqual([
      "Brot",
      "Carbonara",
    ]);
    // What a hand-typed line added stays.
    expect(text(byId("a"))).toBe("200 g");
    expect(byId("a")?.sources).toHaveLength(1);
    // Only there for the recipe and never bought: gone.
    expect(byId("b")).toBeUndefined();
    // Bought on earlier trips: off the list, its history untouched.
    expect(byId("c")).toMatchObject({ onList: false, boughtCount: 5, boughtAt: 40 });
    expect(text(byId("c"))).toBe("");
    expect(recentlyBought(items).map((item) => item.id)).toEqual(["c"]);
    // Mixed units are rebuilt from the entries that are left.
    expect(text(byId("d"))).toBe("1 kg + 500 g");
    // An amount set by hand still wins.
    expect(text(byId("e"))).toBe("3 Zehen");
    // Another recipe's item is untouched.
    expect(byId("f")).toBe(cream);
  });

  it("reads a recipe's share as its own entries added up", () => {
    const tomatoes = makeItem("a", "Tomaten", "produce", {
      amount: [800, "g"],
      sources: [
        fromRecipe("lasagne", "Lasagne", 300, "g"),
        byHand(200, "g"),
        fromRecipe("lasagne", "Lasagne", 300, "g"),
      ],
    });
    expect(text(keeping(tomatoes, (entry) => isFromRecipe(entry, "lasagne")))).toBe("600 g");
    expect(text(keeping(tomatoes, (entry) => !isFromRecipe(entry, "lasagne")))).toBe("200 g");
  });
});

describe("the add sheet", () => {
  it("ranks own items before dictionary foods and skips the list", () => {
    const items = [
      makeItem("a", "Milch", "dairy", { slug: "milk" }),
      makeItem("b", "Minze", "produce", { onList: false, bought: 2, boughtAt: 50 }),
      makeItem("c", "Mischbrot", "bakery", { onList: false, bought: 5, boughtAt: 10 }),
      makeItem("d", "Mandeln", "spices", { onList: false, bought: 5, boughtAt: 20 }),
    ];
    const dictionary = [
      entry("milk", "milk", "Milch", "dairy"),
      entry("mint", "mint", "Minze", "produce"),
      entry("flour", "flour", "Mehl", "grains"),
      entry("mayonnaise", "mayonnaise", "Mayonnaise", "spices"),
    ];
    const names = (query: string, language: string) =>
      suggest(items, dictionary, query, language).map((suggestion) => suggestion.name);
    expect(names("m", "de")).toEqual(["Mandeln", "Mischbrot", "Minze", "Mayonnaise", "Mehl"]);
    expect(names("", "de")).toEqual([]);
    // A compound's tail still finds it.
    expect(names("brot", "de")).toEqual(["Mischbrot"]);
    expect(names("misch", "de")).toEqual(["Mischbrot"]);
    expect(names("ma", "en")).toEqual(["Mandeln", "Mayonnaise"]);
  });

  it("looks up the name part of a typed line and forgives a typo", () => {
    const items = [
      makeItem("a", "Äpfel", "produce", { slug: "apple", onList: false, bought: 12, boughtAt: 50 }),
      makeItem("b", "Tomaten", "produce", { onList: false, bought: 3, boughtAt: 40 }),
    ];
    const dictionary = [entry("apple", "apple", "Apfel", "produce")];
    const names = (query: string) =>
      suggest(items, dictionary, query, "de").map((suggestion) => suggestion.name);
    expect(names("10 äpf")).toEqual(["Äpfel"]);
    expect(names("äpfl")).toEqual(["Äpfel"]);
    expect(names("tomatn")).toEqual(["Tomaten"]);
    expect(names("2 kg tomat")).toEqual(["Tomaten"]);
    expect(names("xyz")).toEqual([]);
    expect(suggest(items, dictionary, "apf", "de")[0]?.isOwn).toBe(true);
    // A line that already is the item (by name, or by the dictionary's slug) is the preview row.
    expect(names("10 äpfel")).toEqual([]);
    expect(names("apfel")).toEqual([]);
  });

  it("suggests a bought item with an amount plain, then with its last amount", () => {
    let items = [
      makeItem("a", "Äpfel", "produce", {
        onList: false,
        bought: 12,
        boughtAt: 50,
        amount: [4, null],
      }),
      makeItem("b", "Apfelmus", "spices", { onList: false, bought: 1, boughtAt: 40 }),
      makeItem("c", "Apfelsaft", "drinks", { amount: [1, "l"] }),
    ];
    const ids = (query: string) =>
      suggest(items, [], query, "de").map((suggestion) => suggestion.id);
    expect(ids("apf")).toEqual(["item-a", "last-a", "item-b"]);
    expect(ids("Äpfel")).toEqual(["last-a", "item-b"]);
    expect(ids("2 apf")).toEqual(["item-a", "item-b"]);
    // The second row puts the item back with its last amount, not the (empty) typed one.
    const last = suggest(items, [], "apf", "de").find((suggestion) => suggestion.lastBought);
    expect(last?.lastBought?.id).toBe("a");
    items = putBack(items, "a", 60, ME);
    expect(items[0].onList).toBe(true);
    expect(text(items[0])).toBe("4");
  });

  it("draws rows that show exactly what lands on the list", () => {
    const items = [
      makeItem("a", "Äpfel", "produce", { slug: "apple", amount: [10, null] }),
      makeItem("b", "Milch", "dairy", { onList: false, bought: 4, boughtAt: 10, amount: [1, "l"] }),
    ];
    const dictionary = [
      entry("apple", "apple", "Apfel", "produce"),
      entry("flour", "flour", "Mehl", "grains"),
    ];
    const row = (query: string) => previewItem(preview(items, dictionary, query));
    expect(row("2 apfel").name).toBe("Äpfel");
    expect(text(row("2 apfel"))).toBe("12");
    expect(text(row("äpfel"))).toBe("10");
    expect(text(row("Milch"))).toBe("");
    expect(row("Milch").onList).toBe(true);
    expect(text(row("2 l Milch"))).toBe("2 l");
    const flour = row("500 g Mehl");
    expect(flour).toMatchObject({ name: "Mehl", ingredientSlug: "flour", aisle: "grains" });
    expect(text(flour)).toBe("500 g");

    const rows = (query: string) =>
      suggest(items, dictionary, query, "de").map((suggestion) =>
        text(suggestionItem(suggestion, line(query)))
      );
    expect(rows("mil")).toEqual(["", "1 l"]);
    expect(rows("2 mil")).toEqual(["2"]);
  });

  it("adds a line matching an item by the dictionary to that item, not a twin", () => {
    const dictionary = [entry("apple", "apple", "Apfel", "produce")];
    const items = add(
      [
        makeItem("a", "Äpfel", "produce", {
          slug: "apple",
          onList: false,
          bought: 2,
          boughtAt: 10,
          amount: [4, null],
        }),
      ],
      "3 apfel",
      20,
      dictionary
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: "Äpfel", onList: true });
    expect(text(items[0])).toBe("3");
  });

  it("shows a dictionary food the line is as the preview, not also as a suggestion", () => {
    const dictionary = [
      entry("flour", "flour", "Mehl", "grains"),
      entry("mealworm", "mealworm", "Mehlwurm", "other"),
    ];
    expect(preview([], dictionary, "Mehl").slug).toBe("flour");
    expect(suggest([], dictionary, "Mehl", "de").map((suggestion) => suggestion.name)).toEqual([
      "Mehlwurm",
    ]);
    expect(suggest([], dictionary, "meh", "de").map((suggestion) => suggestion.name)).toEqual([
      "Mehl",
      "Mehlwurm",
    ]);
  });

  it("adds nothing for a bare name on the list and says so", () => {
    const items = [
      makeItem("a", "Klopapier", "household"),
      makeItem("b", "Äpfel", "produce", { amount: [10, null] }),
      makeItem("c", "Milch", "dairy", { onList: false, bought: 1, boughtAt: 10, amount: [1, "l"] }),
    ];
    expect(addsNothing(preview(items, [], "Klopapier"))).toBe(true);
    expect(addsNothing(preview(items, [], "2 Klopapier"))).toBe(false);
    expect(addsNothing(preview(items, [], "Milch"))).toBe(false);
    expect(text(previewItem(preview(items, [], "Äpfel")))).toBe("10");
    expect(add(items, "Klopapier", 20)).toBe(items);
  });

  it("resolves a line like the server, dictionary slug before name", () => {
    const dictionary = [entry("apple", "apple", "Apfel", "produce")];
    let items = [
      makeItem("old", "apfel", "other", { onList: false, bought: 1, boughtAt: 5 }),
      makeItem("a", "Äpfel", "produce", { slug: "apple", amount: [10, null] }),
    ];
    expect(preview(items, dictionary, "2 apfel").existing?.id).toBe("a");
    items = add(items, "2 apfel", 20, dictionary);
    expect(text(items.find((item) => item.id === "a"))).toBe("12");
    expect(items.find((item) => item.id === "old")?.onList).toBe(false);
  });

  it("says where a line lands and whether it is new", () => {
    const items = [
      makeItem("a", "Klopapier", "household"),
      makeItem("b", "Eier", "dairy", { slug: "egg", onList: false, bought: 2, boughtAt: 1 }),
    ];
    const dictionary = [
      entry("egg", "egg", "Ei", "dairy"),
      entry("ice", "ice", "Eis", "frozen"),
      entry("flour", "flour", "Mehl", "grains"),
    ];
    const onList = preview(items, dictionary, "klopapier");
    expect(onList.aisle).toBe("household");
    expect(onList.existing?.onList).toBe(true);
    const back = preview(items, dictionary, "6 Eier");
    expect(back.aisle).toBe("dairy");
    expect(back.existing?.onList).toBe(false);
    expect(back.line.quantityValue).toBe(6);
    const food = preview(items, dictionary, "500 g Mehl");
    expect(food.aisle).toBe("grains");
    expect(food.existing).toBeNull();
    expect(previewName(food)).toBe("Mehl");
    // An exact name beats a plural form: "Eis" is ice, not eggs.
    expect(preview(items, dictionary, "Eis").aisle).toBe("frozen");
    expect(preview(items, dictionary, "Zahnpasta").aisle).toBe("other");
  });

  it("carries the typed amount onto a tapped suggestion", () => {
    const items = [makeItem("a", "Äpfel", "produce", { onList: false, bought: 12, boughtAt: 50 })];
    const [suggestion] = suggest(items, [], "10 äpfl", "de");
    const next = addLine(
      items,
      [],
      { ...line("10 äpfl"), name: suggestion.name },
      { newId: "x", now: 0, userId: ME }
    );
    expect(next?.items).toHaveLength(1);
    expect(next?.items[0]).toMatchObject({ onList: true, quantityValue: 10 });
  });
});
