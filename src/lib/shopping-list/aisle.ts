/**
 * The store aisles an item is grouped under (Bring's taxonomy), in the order a
 * shop is walked. Ids are the `ingredients.category` values on the server; the
 * four non-food aisles exist only for typed items. The emoji is a tile's last
 * resort picture (see `shoppingEmoji`).
 */
export const AISLES = [
  { id: "produce", labelKey: "shoppingList.aisle.produce", emoji: "🥬" },
  { id: "bakery", labelKey: "shoppingList.aisle.bakery", emoji: "🥖" },
  { id: "dairy", labelKey: "shoppingList.aisle.dairy", emoji: "🥛" },
  { id: "meat-fish", labelKey: "shoppingList.aisle.meatFish", emoji: "🥩" },
  { id: "spices", labelKey: "shoppingList.aisle.spices", emoji: "🧂" },
  { id: "grains", labelKey: "shoppingList.aisle.grains", emoji: "🌾" },
  { id: "frozen", labelKey: "shoppingList.aisle.frozen", emoji: "🧊" },
  { id: "drinks", labelKey: "shoppingList.aisle.drinks", emoji: "🥤" },
  { id: "snacks", labelKey: "shoppingList.aisle.snacks", emoji: "🍫" },
  { id: "household", labelKey: "shoppingList.aisle.household", emoji: "🧻" },
  { id: "care", labelKey: "shoppingList.aisle.care", emoji: "🧴" },
  { id: "pets", labelKey: "shoppingList.aisle.pets", emoji: "🐾" },
  { id: "garden", labelKey: "shoppingList.aisle.garden", emoji: "🌱" },
  { id: "other", labelKey: "shoppingList.aisle.other", emoji: "🛒" },
] as const;

export type ShoppingAisle = (typeof AISLES)[number]["id"];
export type AisleInfo = (typeof AISLES)[number];

const BY_ID = new Map<string, AisleInfo>(AISLES.map((aisle) => [aisle.id, aisle]));

/** An aisle this build doesn't know (the dictionary grew) files under Other. */
export function parseAisle(category: string | null | undefined): ShoppingAisle {
  return BY_ID.get(category ?? "")?.id ?? "other";
}

export function aisleInfo(aisle: ShoppingAisle): AisleInfo {
  return BY_ID.get(aisle) ?? AISLES[AISLES.length - 1];
}
