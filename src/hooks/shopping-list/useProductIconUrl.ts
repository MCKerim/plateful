import { useSupabase } from "@/utils/supabase";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import type { ShoppingDictionaryEntry } from "@/lib/shopping-list/item";

const iconPathsByDictionary = new WeakMap<ShoppingDictionaryEntry[], Map<string, string>>();

/** Built once per loaded dictionary, not once per tile. */
function iconPaths(dictionary: ShoppingDictionaryEntry[]): Map<string, string> {
  let paths = iconPathsByDictionary.get(dictionary);
  if (!paths) {
    paths = new Map(
      dictionary.flatMap((entry) => (entry.iconPath ? [[entry.slug, entry.iconPath] as const] : []))
    );
    iconPathsByDictionary.set(dictionary, paths);
  }
  return paths;
}

/** A product's icon URL by slug, or null while it has none (or the dictionary is loading). */
export function useProductIconUrl(): (slug: string | null) => string | null {
  const { supabase } = useSupabase();
  const { data: dictionary } = useShoppingDictionary();
  return (slug) => {
    const path = slug && dictionary ? iconPaths(dictionary).get(slug) : undefined;
    return path ? supabase.storage.from("product-icons").getPublicUrl(path).data.publicUrl : null;
  };
}
