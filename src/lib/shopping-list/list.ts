import { AISLES, type ShoppingAisle } from "@/lib/shopping-list/aisle";
import { fuzzyScore, normalize } from "@/lib/shopping-list/fuzzy";
import {
  addTypedAmount,
  dictionaryName,
  entryScore,
  hasAmount,
  isFromRecipe,
  itemFromLine,
  itemTitle,
  keeping,
  nameKey,
  normalizedNames,
  parseAmountText,
  spellingMatching,
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

/**
 * The server's `shopping_dictionary_match`: normalize, then the product owning
 * that spelling in the app's language, else in the other one (a spelling
 * belongs to one product per language). No suffix guessing.
 */
function dictionaryMatch(
  dictionary: ShoppingDictionaryEntry[],
  name: string,
  language: string
): ShoppingDictionaryEntry | null {
  const key = normalize(name);
  const owner = (lang: string) =>
    dictionary.find((entry) => normalizedNames(entry, lang).includes(key));
  return owner(language) ?? owner(language === "de" ? "en" : "de") ?? null;
}

/** Whether a name is a dictionary product, for reading a typed line ("Wasser 2"). */
export function isDictionaryProduct(
  dictionary: ShoppingDictionaryEntry[],
  name: string,
  language: string
): boolean {
  return dictionaryMatch(dictionary, name, language) !== null;
}

/** The row under the title the server's trigger will give it (`itemTitle`). */
function retitled(
  item: ShoppingListItem,
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  language: string
): ShoppingListItem {
  const product = item.ingredientSlug
    ? dictionary.find((entry) => entry.slug === item.ingredientSlug)
    : undefined;
  const others = new Set(
    items.filter((other) => other.id !== item.id).map((other) => nameKey(other.name))
  );
  return {
    ...item,
    name: itemTitle(item, product ? dictionaryName(product, language) : null, others),
  };
}

/** What the add sheet shows for the line as typed, and what the add path writes. */
export type ShoppingPreview = {
  line: TypedLine;
  aisle: ShoppingAisle;
  /** The dictionary slug the line matches (the server stamps the same one). */
  slug: string | null;
  /** The household's item this line resolves to, if any. */
  existing: ShoppingListItem | null;
  /**
   * The row as it will stand once the line is added: the household's item with
   * the line in its ledger, the typed amount added and the trigger's title (a
   * bought one starts afresh with exactly the typed amount), the item itself
   * when the line adds nothing, else a new item.
   */
  item: ShoppingListItem;
};

/** On the list already and nothing typed to add: adding only points at the item. */
function pointsAtItem(existing: ShoppingListItem | null, line: TypedLine): boolean {
  return (existing?.onList ?? false) && !hasAmount(line);
}

/**
 * The line's item in the server's order (`add_shopping_list_item`): the item
 * carrying the dictionary slug the name matches, else the one of that name,
 * else a new one. The same order on both sides is what lets the optimistic add
 * update the row the server will answer with. The add path lands the line
 * through the same preview, so the sheet shows what lands.
 */
export function previewLine(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[],
  line: TypedLine,
  language: string,
  options: { id?: string; now?: number; userId?: string | null } = {}
): ShoppingPreview {
  const now = options.now ?? Date.now();
  const source = manualSource(line, now, options.userId ?? null);
  const match = dictionaryMatch(dictionary, line.name, language);
  const own =
    (match && items.find((item) => item.ingredientSlug === match.slug)) ??
    items.find((item) => nameKey(item.name) === nameKey(line.name)) ??
    null;
  const aisle = own?.aisle ?? match?.aisle ?? "other";
  const slug = own?.ingredientSlug ?? match?.slug ?? null;
  let item: ShoppingListItem;
  if (!own) {
    item = itemFromLine(line, { id: options.id ?? "preview", slug, aisle, now, sources: [source] });
  } else if (pointsAtItem(own, line)) {
    item = own;
  } else {
    const freshTrip = !own.onList;
    const landed = {
      ...addTypedAmount(own, line, freshTrip),
      onList: true,
      addedAt: freshTrip ? now : own.addedAt,
      sources: [...(freshTrip ? [] : own.sources), source],
    };
    item = retitled(landed, items, dictionary, language);
  }
  return { line, aisle, slug, existing: own, item };
}

/** On the list already and nothing typed to add: adding only points at the item. */
export function addsNothing(preview: ShoppingPreview): boolean {
  return pointsAtItem(preview.existing, preview.line);
}

/**
 * What a tap on the added card takes back: a new item is deleted, a bought one
 * that came back is taken off again; an amount added to an item on the list
 * (or a line that only pointed at one) has no undo.
 */
export function addUndo(preview: ShoppingPreview): "remove" | "takeOff" | null {
  if (!preview.existing) return "remove";
  return preview.existing.onList ? null : "takeOff";
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
    const display = dictionaryName(entry, language);
    if (knownNames.has(nameKey(display))) continue;
    // Any spelling in either language can match ("apple" in the German app).
    const score = entryScore(entry, query);
    if (score === null) continue;
    const name = spellingMatching(entry, query, language) ?? display;
    if (knownNames.has(nameKey(name))) continue;
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

/** The ledger entry the server writes for a typed line or a put-back, made here too. */
function manualSource(
  line: Amount & { name: string },
  now: number,
  userId: string | null
): ShoppingItemSource {
  return {
    kind: "manual",
    name: line.name,
    addedAt: now,
    addedBy: userId,
    quantityValue: line.quantityValue,
    quantityDisplay: line.quantityDisplay,
    unit: line.unit,
    recipeId: null,
    recipeName: null,
    rawText: null,
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
  options: { newId: string; now: number; userId: string | null; language: string }
): LineAddition | null {
  const preview = previewLine(items, dictionary, line, options.language, {
    id: options.newId,
    now: options.now,
    userId: options.userId,
  });
  const { existing, item } = preview;
  if (!existing) return { items: [...items, item], rowId: item.id, isNewRow: true };
  if (addsNothing(preview)) return null;
  return { items: replace(items, existing.id, () => item), rowId: existing.id, isNewRow: false };
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
 * Name, amount and aisle in one save, as `update_shopping_list_item` stores
 * them. `amountText` null means the amount was not touched: it stays as
 * stored, not re-parsed from its rounded display.
 */
export function editItem(
  item: ShoppingListItem,
  edit: { name: string; amountText: string | null; aisle: ShoppingAisle },
  dictionary: ShoppingDictionaryEntry[],
  language: string
): ShoppingListItem {
  const name = edit.name.trim();
  // A new name is matched afresh: one that is no product's spelling unlinks the row.
  const slug =
    nameKey(name) === nameKey(item.name)
      ? item.ingredientSlug
      : (dictionaryMatch(dictionary, name, language)?.slug ?? null);
  return {
    ...item,
    name,
    // The server takes any change of spelling as the household's own title.
    nameCustom: item.nameCustom || name !== item.name,
    ingredientSlug: slug,
    aisle: edit.aisle,
    ...(edit.amountText === null ? {} : parseAmountText(edit.amountText)),
  };
}

/** Taking a recipe off: the new list, how many rows it touched, the touched rows the server returns. */
export type RecipeRemoval = { items: ShoppingListItem[]; touchedCount: number; keptIds: string[] };

/** The shopper's own words, trimmed; a blank note clears it. */
export function setNote(items: ShoppingListItem[], id: string, text: string): ShoppingListItem[] {
  return replace(items, id, (item) => ({ ...item, note: text.trim() || null }));
}

/**
 * Takes a recipe off: its entries leave every ledger, each amount is rebuilt
 * from what is left and the title from the wordings left. An item nothing else
 * wants is deleted when it was never bought, else taken off the list without
 * counting as bought.
 */
export function removeRecipe(
  items: ShoppingListItem[],
  recipeId: string,
  dictionary: ShoppingDictionaryEntry[],
  language: string
): RecipeRemoval {
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
  // One row at a time, like the server's per-row trigger: a later row sees
  // the titles the earlier ones took.
  const retitledNext = next.reduce(
    (rows, item, index) =>
      touched.has(item.id)
        ? rows.map((row, at) => (at === index ? retitled(item, rows, dictionary, language) : row))
        : rows,
    next
  );
  return {
    items: retitledNext,
    touchedCount: touched.size,
    keptIds: retitledNext.filter((item) => touched.has(item.id)).map((item) => item.id),
  };
}

/** What an add checklist (a recipe's, the planner week's) looks up per row. */
export type ChecklistIndex = {
  /** The dictionary's staples (salt, oil, flour …): off by default. */
  staples: Set<string>;
  /** The aisle a line with this slug files under; Other without one. */
  aisle: (slug: string | null) => ShoppingAisle;
  isStaple: (slug: string | null) => boolean;
  /** On the list now, by the server's identity rule: the slug, else the name. */
  isOnList: (slug: string | null, name: string) => boolean;
};

export function checklistIndex(
  items: ShoppingListItem[],
  dictionary: ShoppingDictionaryEntry[]
): ChecklistIndex {
  const aisles = new Map<string, ShoppingAisle>();
  for (const entry of dictionary) if (!aisles.has(entry.slug)) aisles.set(entry.slug, entry.aisle);
  const staples = new Set(dictionary.filter((entry) => entry.isStaple).map((entry) => entry.slug));
  const onList = items.filter((item) => item.onList);
  const onListSlugs = new Set(onList.map((item) => item.ingredientSlug));
  const onListKeys = new Set(onList.map((item) => nameKey(item.name)));
  return {
    staples,
    aisle: (slug) => (slug && aisles.get(slug)) || "other",
    isStaple: (slug) => slug !== null && staples.has(slug),
    isOnList: (slug, name) =>
      (slug !== null && onListSlugs.has(slug)) || onListKeys.has(nameKey(name)),
  };
}

/** The server's rows replace the ones they touched; new ones join. */
export function mergeRows(items: ShoppingListItem[], rows: ShoppingListItem[]): ShoppingListItem[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const merged = items.map((item) => byId.get(item.id) ?? item);
  const known = new Set(items.map((item) => item.id));
  return [...merged, ...rows.filter((row) => !known.has(row.id))];
}
