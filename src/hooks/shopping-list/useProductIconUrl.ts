import { useSupabase } from "@/utils/supabase";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import type { ShoppingDictionaryEntry } from "@/lib/shopping-list/item";

const entriesByDictionary = new WeakMap<ShoppingDictionaryEntry[], Map<string, ShoppingDictionaryEntry>>();

/** Built once per loaded dictionary, not once per tile. */
function entriesBySlug(dictionary: ShoppingDictionaryEntry[]): Map<string, ShoppingDictionaryEntry> {
  let entries = entriesByDictionary.get(dictionary);
  if (!entries) {
    entries = new Map(dictionary.map((entry) => [entry.slug, entry]));
    entriesByDictionary.set(dictionary, entries);
  }
  return entries;
}

/** A product's dictionary entry by slug; undefined while loading or for an unknown slug. */
export function useDictionaryEntry(): (slug: string | null) => ShoppingDictionaryEntry | undefined {
  const { data: dictionary } = useShoppingDictionary();
  return (slug) => (slug && dictionary ? entriesBySlug(dictionary).get(slug) : undefined);
}

/** A product's icon URL by slug, or null while it has none (or the dictionary is loading). */
export function useProductIconUrl(): (slug: string | null) => string | null {
  const { supabase } = useSupabase();
  const entryFor = useDictionaryEntry();
  return (slug) => {
    const path = entryFor(slug)?.iconPath;
    return path ? supabase.storage.from("product-icons").getPublicUrl(path).data.publicUrl : null;
  };
}
