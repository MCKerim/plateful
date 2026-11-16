import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/utils/supabase";
import { useShoppingDictionary } from "@/hooks/shopping-list/useShoppingDictionary";
import type { ShoppingDictionaryEntry } from "@/lib/shopping-list/item";
import type { ShoppingAisle } from "@/lib/shopping-list/aisle";

type Props = {
  slug: string | null;
  aisle: ShoppingAisle;
  className?: string;
};

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

/**
 * A product's picture: its generated icon from the `product-icons` bucket,
 * else its aisle's paper bag, which marks "no picture yet" at a glance. The
 * slot stays empty while the icon loads (a bag swapping to the product would
 * read as a different item). Decorative: every row names the product beside it.
 * Mirrors the native app's `ProductIcon.swift`.
 */
export default function ProductIcon({ slug, aisle, className }: Readonly<Props>) {
  const { supabase } = useSupabase();
  const { data: dictionary } = useShoppingDictionary();
  const path = slug && dictionary ? iconPaths(dictionary).get(slug) : undefined;
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const src =
    path && path !== failedPath
      ? supabase.storage.from("product-icons").getPublicUrl(path).data.publicUrl
      : `/product-bags/${aisle}.webp`;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      decoding="async"
      draggable={false}
      className={cn("object-contain", className)}
      onError={() => path && setFailedPath(path)}
    />
  );
}
