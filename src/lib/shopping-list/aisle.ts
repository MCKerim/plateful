/**
 * The store aisles an item is grouped under (Bring's taxonomy), in the order a
 * shop is walked. Ids are the `ingredients.category` values on the server; the
 * four non-food aisles exist only for typed items. Each id also names its
 * paper-bag placeholder, `public/product-bags/<id>.webp` (see `ProductIcon`).
 */
export const AISLES = [
  { id: "produce", labelKey: "shoppingList.aisle.produce" },
  { id: "bakery", labelKey: "shoppingList.aisle.bakery" },
  { id: "dairy", labelKey: "shoppingList.aisle.dairy" },
  { id: "meat-fish", labelKey: "shoppingList.aisle.meatFish" },
  { id: "spices", labelKey: "shoppingList.aisle.spices" },
  { id: "grains", labelKey: "shoppingList.aisle.grains" },
  { id: "frozen", labelKey: "shoppingList.aisle.frozen" },
  { id: "drinks", labelKey: "shoppingList.aisle.drinks" },
  { id: "snacks", labelKey: "shoppingList.aisle.snacks" },
  { id: "household", labelKey: "shoppingList.aisle.household" },
  { id: "care", labelKey: "shoppingList.aisle.care" },
  { id: "pets", labelKey: "shoppingList.aisle.pets" },
  { id: "garden", labelKey: "shoppingList.aisle.garden" },
  { id: "other", labelKey: "shoppingList.aisle.other" },
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
