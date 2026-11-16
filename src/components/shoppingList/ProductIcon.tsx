import { useState } from "react";
import { cn } from "@/lib/utils";
import { useProductIconUrl } from "@/hooks/shopping-list/useProductIconUrl";
import type { ShoppingAisle } from "@/lib/shopping-list/aisle";

type Props = {
  slug: string | null;
  aisle: ShoppingAisle;
  className?: string;
};

/**
 * A product's picture: its generated icon from the `product-icons` bucket,
 * else its aisle's paper bag, which marks "no picture yet" at a glance. The
 * slot stays empty while the icon loads (a bag swapping to the product would
 * read as a different item). Decorative: every row names the product beside it.
 * Mirrors the native app's `ProductIcon.swift`.
 */
export default function ProductIcon({ slug, aisle, className }: Readonly<Props>) {
  const iconUrl = useProductIconUrl()(slug);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = iconUrl && iconUrl !== failedUrl ? iconUrl : `/product-bags/${aisle}.webp`;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      decoding="async"
      draggable={false}
      className={cn("object-contain", className)}
      onError={() => iconUrl && setFailedUrl(iconUrl)}
    />
  );
}
