export const collectionColorKeys = [
  "orange",
  "coral",
  "rose",
  "plum",
  "indigo",
  "blue",
  "teal",
  "mint",
  "green",
  "olive",
  "gold",
  "cocoa",
] as const;

export type CollectionColorKey = (typeof collectionColorKeys)[number];
export type CollectionTheme = "light" | "dark";

type CollectionColorDefinition = {
  light: string;
  dark: string;
  nameKey: `collections.colors.${CollectionColorKey}`;
};

export const collectionColorPalette: Record<CollectionColorKey, CollectionColorDefinition> = {
  orange: { light: "#E88300", dark: "#FFB340", nameKey: "collections.colors.orange" },
  coral: { light: "#E95D52", dark: "#FF8177", nameKey: "collections.colors.coral" },
  rose: { light: "#E43D62", dark: "#FF6482", nameKey: "collections.colors.rose" },
  plum: { light: "#9C46C7", dark: "#C877E7", nameKey: "collections.colors.plum" },
  indigo: { light: "#5654C5", dark: "#7B7AE8", nameKey: "collections.colors.indigo" },
  blue: { light: "#3477BE", dark: "#63A0E3", nameKey: "collections.colors.blue" },
  teal: { light: "#248FA3", dark: "#50C8D8", nameKey: "collections.colors.teal" },
  mint: { light: "#28997F", dark: "#56CFB3", nameKey: "collections.colors.mint" },
  green: { light: "#2A9D4B", dark: "#52D273", nameKey: "collections.colors.green" },
  olive: { light: "#748F2F", dark: "#A9C95A", nameKey: "collections.colors.olive" },
  gold: { light: "#B98812", dark: "#E8BA45", nameKey: "collections.colors.gold" },
  cocoa: { light: "#89583D", dark: "#C18A65", nameKey: "collections.colors.cocoa" },
};

export function isCollectionColorKey(value: string): value is CollectionColorKey {
  return collectionColorKeys.includes(value as CollectionColorKey);
}

export function resolveCollectionColor(
  colorKey: string | null | undefined,
  theme: CollectionTheme
): string {
  const safeKey = colorKey && isCollectionColorKey(colorKey) ? colorKey : "orange";
  return collectionColorPalette[safeKey][theme];
}

export function getCollectionColorNameKey(
  colorKey: string | null | undefined
): CollectionColorDefinition["nameKey"] {
  const safeKey = colorKey && isCollectionColorKey(colorKey) ? colorKey : "orange";
  return collectionColorPalette[safeKey].nameKey;
}
