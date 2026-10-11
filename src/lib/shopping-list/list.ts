import { AISLES, type ShoppingAisle } from "@/lib/shopping-list/aisle";
import { fuzzyScore, normalize } from "@/lib/shopping-list/fuzzy";
import {
  addTypedAmount,
  dictionaryName,
  hasAmount,
  isFromRecipe,
  itemFromLine,
  keeping,
  nameKey,
  parseAmountText,
  type Amount,
  type ShoppingDictionaryEntry,
  type ShoppingItemSource,
  type ShoppingListItem,
  type TypedLine,
} from "@/lib/shopping-list/item";

export const RECENTLY_BOUGHT_LIMIT = 20;
export const SUGGESTION_LIMIT = 8;

export type AisleSection = { aisle: ShoppingAisle; items: ShoppingListItem[] };

/** A recipe on this trip: what the header's covers show and its sheet takes off. */
export type TripRecipe = {
  id: string;
  /** Its name when it was added, so a deleted recipe keeps one. */
  name: string;
  addedAt: number | null;
  addedBy: string | null;
  /** One add stamps all its lines with the same time, so distinct times count the adds. */
  timesAdded: number;
  /** The items it put on the list, in store-walk order. */
  items: ShoppingListItem[];
};

/** One section per aisle with something to buy, in store-walk order; oldest added first. */
export function aisleSections(items: ShoppingListItem[]): AisleSection[] {
  return AISLES.map(({ id }) => ({
    aisle: id,
    items: items
      .filter((item) => item.onList && item.aisle === id)
      .sort((a, b) => a.addedAt - b.addedAt),
  })).filter((section) => section.items.length > 0);
}

/** What was bought last, newest first, capped: one tap puts it back. */
export function recentlyBought(items: ShoppingListItem[]): ShoppingListItem[] {
  return items
    .filter((item) => !item.onList && item.boughtAt !== null)
    .sort((a, b) => (b.boughtAt ?? 0) - (a.boughtAt ?? 0))
    .slice(0, RECENTLY_BOUGHT_LIMIT);
}

/** Nothing on the list and nothing ever bought: the tab's empty state. */
export function isListEmpty(items: ShoppingListItem[]): boolean {
  return !items.some((item) => item.onList || item.boughtAt !== null);
}

/**
 * The recipes this trip's items came from, the one added last first, read from
 * the on-list items' ledgers, so buying a recipe's last item takes it off too.
 */
export function tripRecipes(sections: AisleSection[]): TripRecipe[] {
  const byId = new Map<string, TripRecipe>();
  const addTimes = new Map<string, Set<number | null>>();
  for (const item of sections.flatMap((section) => section.items)) {
    for (const source of item.sources) {
      if (source.kind !== "recipe" || source.recipeId === null) continue;
      const id = source.recipeId;
      const recipe: TripRecipe = byId.get(id) ?? {
        id,
        name: source.recipeName ?? "",
        addedAt: null,
        addedBy: null,
        timesAdded: 1,
        items: [],
      };
      if (recipe.items[recipe.items.length - 1]?.id !== item.id) recipe.items.push(item);
      if (source.recipeName) recipe.name = source.recipeName;
      const times = addTimes.get(id) ?? new Set();
      times.add(source.addedAt);
      addTimes.set(id, times);
      recipe.timesAdded = times.size;
      if (source.addedAt !== null && source.addedAt > (recipe.addedAt ?? -Infinity)) {
        recipe.addedAt = source.addedAt;
        recipe.addedBy = source.addedBy;
      }
      byId.set(id, recipe);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const aAt = a.addedAt ?? -Infinity;
    const bAt = b.addedAt ?? -Infinity;
    if (aAt !== bAt) return bAt - aAt;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}

/** The server's dictionary match: exact name in either language, else a plural ending. */
function dictionaryMatch(
  dictionary: ShoppingDictionaryEntry[],
  key: string
): ShoppingDictionaryEntry | null {
  let exact: ShoppingDictionaryEntry | null = null;
  let plural: ShoppingDictionaryEntry | null = null;
  for (const entry of dictionary) {
    const en = entry.nameEn.toLowerCase();
    const de = entry.nameDe.toLowerCase();
    if (key === en || key === de) {
      if (!exact || entry.slug < exact.slug) exact = entry;
    } else if (
      [`${en}s`, `${en}es`, `${de}n`, `${de}en`, `${de}e`, `${de}s`, `${de}er`].includes(key)
    ) {
      if (!plural || entry.slug < plural.slug) plural = entry;
    }
  }
  return exact ?? plural;
}

/** What the add sheet shows for the line as typed, and what the add path writes. */
export type ShoppingPreview = {
  line: TypedLine;
  aisle: ShoppingAisle;
  /** The dictionary slug the line matches (the server stamps the same one). */
  slug: string | null;
  /** The household's item this line resolves to, if any. */
  existing: ShoppingListItem | null;
};

/**
 * The line's item in the server's order (`add_shopping_list_item`): the item
 * carrying the dictionary slug the name matches, else the one of that name,
 * else a new one. The same order on both sides is what lets the optimistic add
 * update the row the server will answer with.
 */
export function previewLine(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  line: TypedLine
): ShoppingPreview {
  const key = nameKey(line.name);
  const match = dictionaryMatch(dictionary, key);
  const own =
    (match && items.find((item) => item.ingredientSlug === match.slug)) ??
    items.find((item) => nameKey(item.name) === key) ??
    null;
  return {
    line,
    aisle: own?.aisle ?? match?.aisle ?? "other",
    slug: own?.ingredientSlug ?? match?.slug ?? null,
    existing: own,
  };
}

/** The name on the list: the household's item keeps its own ("apfel" puts "Äpfel" back). */
export function previewName(preview: ShoppingPreview): string {
  return preview.existing?.name ?? preview.line.name;
}

/** On the list already and nothing typed to add: adding only points at the item. */
export function addsNothing(preview: ShoppingPreview): boolean {
  return (preview.existing?.onList ?? false) && !hasAmount(preview.line);
}

/**
 * The row as it will stand once the line is added: the household's item with
 * the typed amount added (a bought one starts afresh with exactly the typed
 * amount), else a new item.
 */
export function previewItem(preview: ShoppingPreview): ShoppingListItem {
  const { existing, line } = preview;
  if (!existing) {
    return itemFromLine(line, {
      id: "preview",
      slug: preview.slug,
      aisle: preview.aisle,
      now: Date.now(),
    });
  }
  if (addsNothing(preview)) return existing;
  return { ...addTypedAmount(existing, line, !existing.onList), onList: true };
}

/** One row under the add field while typing. */
export type ShoppingSuggestion = {
  id: string;
  name: string;
  aisle: ShoppingAisle;
  /** The household's own item, as opposed to a dictionary food. */
  isOwn: boolean;
  boughtCount: number;
  slug: string | null;
  /** The bought item this row puts back with its last amount; null on a plain row. */
  lastBought: ShoppingListItem | null;
};

function ownSuggestion(item: ShoppingListItem, lastBought = false): ShoppingSuggestion {
  return {
    id: `${lastBought ? "last" : "item"}-${item.id}`,
    name: item.name,
    aisle: item.aisle,
    isOwn: true,
    boughtCount: item.boughtCount,
    slug: item.ingredientSlug,
    lastBought: lastBought ? item : null,
  };
}

/**
 * What a typed line could mean, best first: name match, own items before
 * dictionary foods never used, most bought, most recent, alphabetical. What the
 * line itself resolves to is the preview row, so it isn't listed again. A bought
 * item that kept an amount gets a second row with that amount right under its
 * plain one (Bring's two tiles), unless the line carries its own amount.
 */
export function suggestions(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  preview: ShoppingPreview,
  language: string
): ShoppingSuggestion[] {
  const query = normalize(preview.line.name);
  if (!query) return [];
  type Ranked = {
    suggestion: ShoppingSuggestion;
    item: ShoppingListItem | null;
    score: number;
    boughtAt: number;
  };
  const ranked: Ranked[] = [];
  for (const item of items) {
    if (item.onList || item.id === preview.existing?.id) continue;
    const score = fuzzyScore(query, normalize(item.name));
    if (score !== null) {
      ranked.push({
        suggestion: ownSuggestion(item),
        item,
        score,
        boughtAt: item.boughtAt ?? -Infinity,
      });
    }
  }
  const knownSlugs = new Set(items.map((item) => item.ingredientSlug).filter(Boolean));
  const knownNames = new Set(items.map((item) => nameKey(item.name)));
  for (const entry of dictionary) {
    if (knownSlugs.has(entry.slug) || entry.slug === preview.slug) continue;
    const name = dictionaryName(entry, language);
    if (knownNames.has(nameKey(name))) continue;
    const score = fuzzyScore(query, normalize(name));
    if (score === null) continue;
    ranked.push({
      suggestion: {
        id: `food-${entry.slug}`,
        name,
        aisle: entry.aisle,
        isOwn: false,
        boughtCount: 0,
        slug: entry.slug,
        lastBought: null,
      },
      item: null,
      score,
      boughtAt: -Infinity,
    });
  }
  ranked.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.suggestion.isOwn !== b.suggestion.isOwn) return a.suggestion.isOwn ? -1 : 1;
    if (a.suggestion.boughtCount !== b.suggestion.boughtCount) {
      return b.suggestion.boughtCount - a.suggestion.boughtCount;
    }
    if (a.boughtAt !== b.boughtAt) return b.boughtAt - a.boughtAt;
    return a.suggestion.name < b.suggestion.name
      ? -1
      : a.suggestion.name > b.suggestion.name
        ? 1
        : 0;
  });
  const top = ranked.slice(0, SUGGESTION_LIMIT);
  if (hasAmount(preview.line)) return top.map((entry) => entry.suggestion);

  const lastBought = (item: ShoppingListItem | null) =>
    item && !item.onList && hasAmount(item) ? [ownSuggestion(item, true)] : [];
  return [
    ...lastBought(preview.existing),
    ...top.flatMap((entry) => [entry.suggestion, ...lastBought(entry.item)]),
  ];
}

/** The row a tap on a suggestion puts on the list: its last amount, else the typed one. */
export function suggestionItem(suggestion: ShoppingSuggestion, line: TypedLine): ShoppingListItem {
  return (
    suggestion.lastBought ??
    itemFromLine(
      { ...line, name: suggestion.name },
      { id: suggestion.id, slug: suggestion.slug, aisle: suggestion.aisle, now: Date.now() }
    )
  );
}

function manualSource(amount: Amount, now: number, userId: string | null): ShoppingItemSource {
  return {
    kind: "manual",
    addedAt: now,
    addedBy: userId,
    quantityValue: amount.quantityValue,
    quantityDisplay: amount.quantityDisplay,
    unit: amount.unit,
    recipeId: null,
    recipeName: null,
  };
}

function replace(
  items: ShoppingListItem[],
  id: string,
  change: (item: ShoppingListItem) => ShoppingListItem
): ShoppingListItem[] {
  return items.map((item) => (item.id === id ? change(item) : item));
}

/** Ticks an item off: it keeps its amount for "recently bought", the trip's ledger goes. */
export function markBought(items: ShoppingListItem[], id: string, now: number): ShoppingListItem[] {
  return replace(items, id, (item) =>
    item.onList
      ? { ...item, onList: false, boughtAt: now, boughtCount: item.boughtCount + 1, sources: [] }
      : item
  );
}

/** Puts a bought item back with its last amount; the trigger's manual entry, mirrored. */
export function putBack(
  items: ShoppingListItem[],
  id: string,
  now: number,
  userId: string | null
): ShoppingListItem[] {
  return replace(items, id, (item) =>
    item.onList
      ? item
      : { ...item, onList: true, addedAt: now, sources: [manualSource(item, now, userId)] }
  );
}

/** What adding a typed line does, and the row the RPC answers for. Null when it adds nothing. */
export type LineAddition = { items: ShoppingListItem[]; rowId: string; isNewRow: boolean };

/**
 * The one add path. An item on the list gets the typed amount added; a bought
 * one comes back with exactly the typed amount; anything else is a new item
 * under the dictionary's aisle (Other until the server answers).
 */
export function addLine(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  line: TypedLine,
  options: { newId: string; now: number; userId: string | null }
): LineAddition | null {
  const preview = previewLine(items, dictionary, line);
  const { existing } = preview;
  if (existing) {
    if (addsNothing(preview)) return null;
    const freshTrip = !existing.onList;
    const updated = replace(items, existing.id, (item) => {
      const sources = [
        ...(freshTrip ? [] : item.sources),
        manualSource(line, options.now, options.userId),
      ];
      return {
        ...addTypedAmount(item, line, freshTrip),
        onList: true,
        addedAt: freshTrip ? options.now : item.addedAt,
        sources,
      };
    });
    return { items: updated, rowId: existing.id, isNewRow: false };
  }
  const item = itemFromLine(line, {
    id: options.newId,
    slug: preview.slug,
    aisle: preview.aisle,
    now: options.now,
    sources: [manualSource(line, options.now, options.userId)],
  });
  return { items: [...items, item], rowId: item.id, isNewRow: true };
}

export type EditProblem = "nameRequired" | "duplicateName";

/** Refuses a blank name or one the household already has, before anything changes. */
export function editProblem(
  items: ShoppingListItem[],
  id: string,
  name: string
): EditProblem | null {
  const key = nameKey(name);
  if (!key) return "nameRequired";
  return items.some((item) => item.id !== id && nameKey(item.name) === key)
    ? "duplicateName"
    : null;
}

/**
 * Name, amount and aisle in one save. `amountText` null means the amount was
 * not touched: it stays as stored, not re-parsed from its rounded display.
 */
export function editItem(
  item: ShoppingListItem,
  edit: { name: string; amountText: string | null; aisle: ShoppingAisle }
): ShoppingListItem {
  return {
    ...item,
    name: edit.name.trim(),
    aisle: edit.aisle,
    ...(edit.amountText === null ? {} : parseAmountText(edit.amountText)),
  };
}

/** Taking a recipe off: the new list, how many rows it touched, the touched rows the server returns. */
export type RecipeRemoval = { items: ShoppingListItem[]; touchedCount: number; keptIds: string[] };

/**
 * Takes a recipe off: its entries leave every ledger and each amount is rebuilt
 * from what is left. An item nothing else wants is deleted when it was never
 * bought, else taken off the list without counting as bought.
 */
export function removeRecipe(items: ShoppingListItem[], recipeId: string): RecipeRemoval {
  const touched = new Set(
    items
      .filter(
        (item) => item.onList && item.sources.some((source) => isFromRecipe(source, recipeId))
      )
      .map((item) => item.id)
  );
  const next = items.flatMap((item) => {
    if (!touched.has(item.id)) return [item];
    const rest = keeping(item, (source) => !isFromRecipe(source, recipeId));
    if (rest.sources.length > 0) return [rest];
    return item.boughtCount === 0 ? [] : [{ ...rest, onList: false }];
  });
  return {
    items: next,
    touchedCount: touched.size,
    keptIds: next.filter((item) => touched.has(item.id)).map((item) => item.id),
  };
}

/** The server's rows replace the ones they touched; new ones join. */
export function mergeRows(items: ShoppingListItem[], rows: ShoppingListItem[]): ShoppingListItem[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const merged = items.map((item) => byId.get(item.id) ?? item);
  const known = new Set(items.map((item) => item.id));
  return [...merged, ...rows.filter((row) => !known.has(row.id))];
}
