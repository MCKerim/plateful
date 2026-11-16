import type { Database, Json } from "@/types/database.types";
import { parseIngredient } from "@/lib/ingredient-parser/parse-ingredient";
import { parseAisle, type ShoppingAisle } from "@/lib/shopping-list/aisle";
import { amountText, storedAmountText } from "@/lib/shopping-list/amount";
import { fuzzyScore, normalize } from "@/lib/shopping-list/fuzzy";

export type ShoppingListItemRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];
type DictionaryRow = Database["public"]["Views"]["ingredient_dictionary"]["Row"];

/** An amount as stored: value, the written display ("1/2", "2-3"), unit; any may be null. */
export type Amount = {
  quantityValue: number | null;
  quantityDisplay: string | null;
  unit: string | null;
};

/**
 * One addition to an item's trip, as the server records it in `sources`: a
 * recipe's line, a typed line (or a put-back), or the amount set outright in
 * the edit sheet. Buying wipes them with the trip.
 */
export type ShoppingItemSource = Amount & {
  kind: "recipe" | "manual" | "set";
  /**
   * The wording this addition used (a recipe line's ingredient name, what was
   * typed, a put-back's row name): the row's title follows it. Null on entries
   * written before 2026-11-10 and on amounts set by hand.
   */
  name: string | null;
  /** Epoch ms; null on entries written before the server stamped them. */
  addedAt: number | null;
  /** `users.id`; null when unknown. */
  addedBy: string | null;
  recipeId: string | null;
  /** The recipe's name at the time, so it survives the recipe being deleted. */
  recipeName: string | null;
  /** A recipe's line as written ("200 ml Schlagsahne"). */
  rawText: string | null;
};

/**
 * One product in the household's catalogue: "Äpfel" is one permanent row that
 * moves onto the list, gets bought and comes back as the same row. Buying keeps
 * the amount; the ledger (`sources`) belongs to one trip.
 */
export type ShoppingListItem = Amount & {
  id: string;
  /** The title: the trip's one wording, the product's name when wordings differ, or the household's rename. */
  name: string;
  /** The household renamed the row, so the title no longer follows the wordings. */
  nameCustom: boolean;
  /** The shopper's own words ("Bio", "die große Packung"), kept across trips like the aisle. */
  note: string | null;
  ingredientSlug: string | null;
  aisle: ShoppingAisle;
  onList: boolean;
  /** Epoch ms of when it last came onto the list. */
  addedAt: number;
  boughtAt: number | null;
  boughtCount: number;
  /** What this trip's amount is made of, oldest first; empty off the list. */
  sources: ShoppingItemSource[];
  createdAt: number;
};

/** One dictionary product (`ingredient_dictionary`), for recognition and suggestions. */
export type ShoppingDictionaryEntry = {
  slug: string;
  nameEn: string;
  nameDe: string;
  aisle: ShoppingAisle;
  isStaple: boolean;
  /** The product's file in the `product-icons` bucket; null until it has one. */
  iconPath: string | null;
  /** Every spelling the server matches on (`ingredient_names`), display names included. */
  namesDe: string[];
  namesEn: string[];
};

/** A typed line split the way a recipe ingredient is: "10 Äpfel" is 10 of "Äpfel". */
export type TypedLine = Amount & { name: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function timeOrNull(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Lenient on purpose: entries from before the ledger have no `kind` or
 * `added_at`, and a broken field never fails the item. No kind is a recipe's
 * line when it names a recipe; a kind this build doesn't know is never one,
 * which is how the server's removal reads it.
 */
export function parseSource(raw: Json): ShoppingItemSource | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const recipeId = stringOrNull(raw.recipe_id);
  const rawKind = stringOrNull(raw.kind);
  const kind =
    rawKind === null
      ? recipeId === null
        ? "manual"
        : "recipe"
      : rawKind === "recipe" || rawKind === "set"
        ? rawKind
        : "manual";
  const addedBy = stringOrNull(raw.added_by);
  return {
    kind,
    addedAt: timeOrNull(raw.added_at),
    addedBy: addedBy && UUID.test(addedBy) ? addedBy.toLowerCase() : null,
    quantityValue: numberOrNull(raw.quantity_value),
    quantityDisplay: stringOrNull(raw.quantity_display),
    unit: stringOrNull(raw.unit),
    recipeId,
    recipeName: stringOrNull(raw.recipe_name),
    name: stringOrNull(raw.name),
    rawText: stringOrNull(raw.raw_text),
  };
}

export function parseShoppingListItem(row: ShoppingListItemRow): ShoppingListItem {
  const createdAt = timeOrNull(row.created_at) ?? 0;
  const sources = Array.isArray(row.sources)
    ? row.sources.map(parseSource).filter((source) => source !== null)
    : [];
  return {
    id: row.id,
    name: row.name,
    nameCustom: row.name_custom ?? false,
    note: row.note ?? null,
    quantityValue: row.quantity_value,
    quantityDisplay: row.quantity_display,
    unit: row.unit,
    ingredientSlug: row.ingredient_slug,
    aisle: parseAisle(row.category),
    onList: row.on_list ?? true,
    addedAt: timeOrNull(row.added_at) ?? createdAt,
    boughtAt: timeOrNull(row.bought_at),
    boughtCount: row.bought_count ?? 0,
    sources,
    createdAt,
  };
}

/** Null for a row without a slug (the view's columns are nullable in the types only). */
export function parseDictionaryEntry(
  row: Pick<
    DictionaryRow,
    "slug" | "name_en" | "name_de" | "category" | "is_staple" | "names_de" | "names_en" | "icon_path"
  >
): ShoppingDictionaryEntry | null {
  if (!row.slug) return null;
  const nameEn = row.name_en ?? "";
  const nameDe = row.name_de ?? "";
  return {
    slug: row.slug,
    nameEn,
    nameDe,
    aisle: parseAisle(row.category),
    isStaple: row.is_staple ?? false,
    iconPath: row.icon_path ?? null,
    // Without its names an entry still matches on its display names.
    namesDe: row.names_de?.length ? row.names_de : [nameDe],
    namesEn: row.names_en?.length ? row.names_en : [nameEn],
  };
}

const capitalized = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

/** The name in the app's language, capitalized (the worker writes English lowercase). */
export function dictionaryName(entry: ShoppingDictionaryEntry, language: string): string {
  return capitalized(language === "de" ? entry.nameDe : entry.nameEn);
}

/** Every spelling of the product in one language, normalized. */
export function normalizedNames(entry: ShoppingDictionaryEntry, language: string): string[] {
  return (language === "de" ? entry.namesDe : entry.namesEn).map(normalize);
}

/**
 * The app-language spelling a normalized query matches best, so a suggestion
 * shows and saves what the shopper is typing: "Klo" offers "Klopapier", not the
 * display name "Toilettenpapier". The display name wins a tie; null when a
 * spelling of the other language matches better ("apple" in the German app).
 */
export function spellingMatching(
  entry: ShoppingDictionaryEntry,
  query: string,
  language: string
): string | null {
  const display = normalize(language === "de" ? entry.nameDe : entry.nameEn);
  const names = language === "de" ? entry.namesDe : entry.namesEn;
  const normalized = normalizedNames(entry, language);
  let best: { name: string; score: number } | null = null;
  for (let index = 0; index < names.length; index += 1) {
    const score = fuzzyScore(query, normalized[index]);
    if (score === null) continue;
    const ranked = score + (normalized[index] === display ? 1 : 0);
    if (!best || ranked > best.score) best = { name: names[index], score: ranked };
  }
  const overall = entryScore(entry, query);
  return best && overall !== null && best.score >= overall ? capitalized(best.name) : null;
}

/** How well a normalized query matches any spelling of the product, in either language; null for none. */
export function entryScore(entry: ShoppingDictionaryEntry, query: string): number | null {
  let best: number | null = null;
  for (const name of [...normalizedNames(entry, "de"), ...normalizedNames(entry, "en")]) {
    const score = fuzzyScore(query, name);
    if (score !== null && (best === null || score > best)) best = score;
  }
  return best;
}

/** The identity a typed line is matched on (the server's `name_key`). */
export function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function hasAmount(amount: Amount): boolean {
  return amount.quantityValue !== null || amount.quantityDisplay !== null || amount.unit !== null;
}

export function itemAmountText(amount: Amount, locale: string): string {
  return amountText(amount.quantityValue, amount.quantityDisplay, amount.unit, locale);
}

export function isFromRecipe(source: ShoppingItemSource, recipeId: string): boolean {
  return source.kind === "recipe" && source.recipeId === recipeId;
}

/**
 * The title the server's `shopping_item_title` trigger gives the row for its
 * ledger, so an optimistic row matches the answer: the household's rename
 * stays; one distinct wording (folded like the dictionary match) is the title
 * in its newest spelling; several on a product row take the product's name;
 * none (a bought row) keep the title. A title equal to the current one once
 * folded (case, accents, spaces), or whose key another row of the household
 * holds (`name_key` is unique), is skipped.
 */
export function itemTitle(
  item: ShoppingListItem,
  productName: string | null,
  otherNameKeys: Set<string>
): string {
  if (item.nameCustom) return item.name;
  const wordings = item.sources.flatMap((source) => source.name?.trim() || []);
  const distinct = new Set(wordings.map(normalize)).size;
  const candidate =
    distinct === 0
      ? null
      : distinct === 1
        ? wordings[wordings.length - 1]
        : item.ingredientSlug === null
          ? null
          : productName;
  if (
    !candidate ||
    normalize(candidate) === normalize(item.name) ||
    otherNameKeys.has(nameKey(candidate))
  ) {
    return item.name;
  }
  return candidate;
}

/**
 * The line as it came in, for the details sheet: a recipe's line as written, a
 * typed wording only where it isn't the title, nothing for an amount set by hand.
 */
export function originalLine(item: ShoppingListItem, source: ShoppingItemSource): string | null {
  if (source.kind === "recipe") return source.rawText ?? source.name;
  if (source.kind === "set" || !source.name) return null;
  const wording = normalize(source.name);
  return wording && wording !== normalize(item.name) ? source.name : null;
}

/** Null for a blank line. */
export function parseTypedLine(text: string): TypedLine | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = parseIngredient(trimmed);
  return {
    name: parsed.ingredientName ?? trimmed,
    quantityValue: parsed.quantityValue,
    quantityDisplay: parsed.quantityDisplay,
    unit: parsed.unit,
  };
}

/**
 * Adds a typed amount the way the server does: a fresh trip or an item without
 * an amount takes the typed one; the same unit sums; a different unit keeps
 * both as text ("500 g + 2 EL"), built from the displays as stored.
 */
export function addTypedAmount<T extends Amount>(item: T, typed: Amount, freshTrip: boolean): T {
  if (freshTrip || (item.quantityValue === null && item.quantityDisplay === null)) {
    return { ...item, ...pickAmount(typed) };
  }
  if (
    item.quantityValue !== null &&
    typed.quantityValue !== null &&
    (item.unit ?? "").toLowerCase() === (typed.unit ?? "").toLowerCase()
  ) {
    return {
      ...item,
      quantityValue: item.quantityValue + typed.quantityValue,
      quantityDisplay: null,
    };
  }
  const mine = storedAmountText(item.quantityValue, item.quantityDisplay, item.unit);
  const theirs = storedAmountText(typed.quantityValue, typed.quantityDisplay, typed.unit);
  return { ...item, quantityValue: null, quantityDisplay: `${mine} + ${theirs}`, unit: null };
}

function pickAmount(amount: Amount): Amount {
  return {
    quantityValue: amount.quantityValue,
    quantityDisplay: amount.quantityDisplay,
    unit: amount.unit,
  };
}

const NO_AMOUNT: Amount = { quantityValue: null, quantityDisplay: null, unit: null };

/**
 * The item as if only the entries `include` keeps had been made: the ledger
 * replayed oldest first (a set entry replaces, any other adds). Mirrors
 * `remove_recipe_from_shopping_list` on the server.
 */
export function keeping(
  item: ShoppingListItem,
  include: (source: ShoppingItemSource) => boolean
): ShoppingListItem {
  const sources = item.sources.filter(include);
  let replayed: ShoppingListItem = { ...item, ...NO_AMOUNT, sources };
  for (const source of sources) {
    if (source.kind === "set") replayed = { ...replayed, ...pickAmount(source) };
    else if (hasAmount(source)) replayed = addTypedAmount(replayed, source, false);
  }
  return replayed;
}

/**
 * The amount set outright (the edit sheet): "3 kg" → 3 kg, "2 Packungen" → 2
 * Packungen, "etwas" stays text, "" → no amount.
 */
export function parseAmountText(text: string): Amount {
  const trimmed = text.trim();
  if (!trimmed) return NO_AMOUNT;
  const parsed = parseIngredient(trimmed);
  if (parsed.unit) {
    return {
      quantityValue: parsed.quantityValue,
      quantityDisplay: parsed.quantityDisplay,
      unit: parsed.unit,
    };
  }
  if (parsed.quantityValue === null) {
    return { quantityValue: null, quantityDisplay: trimmed, unit: null };
  }
  // A word the parser doesn't know as a unit ("Packungen") is the unit here.
  return {
    quantityValue: parsed.quantityValue,
    quantityDisplay: parsed.quantityDisplay,
    unit: parsed.ingredientName || null,
  };
}

/** A new item from a typed line, on the list from `now`. */
export function itemFromLine(
  line: TypedLine,
  options: {
    id: string;
    slug: string | null;
    aisle: ShoppingAisle;
    now: number;
    sources?: ShoppingItemSource[];
  }
): ShoppingListItem {
  return {
    id: options.id,
    name: line.name,
    nameCustom: false,
    note: null,
    ...pickAmount(line),
    ingredientSlug: options.slug,
    aisle: options.aisle,
    onList: true,
    addedAt: options.now,
    boughtAt: null,
    boughtCount: 0,
    sources: options.sources ?? [],
    createdAt: options.now,
  };
}
