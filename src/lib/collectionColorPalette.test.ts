import { describe, expect, it } from "vitest";
import {
  collectionColorKeys,
  resolveCollectionColor,
} from "./collectionColorPalette";

describe("collectionColorPalette", () => {
  it("resolves every key to distinct light and dark colors", () => {
    const light = collectionColorKeys.map((key) => resolveCollectionColor(key, "light"));
    const dark = collectionColorKeys.map((key) => resolveCollectionColor(key, "dark"));

    expect(new Set(light).size).toBe(collectionColorKeys.length);
    expect(new Set(dark).size).toBe(collectionColorKeys.length);
    collectionColorKeys.forEach((key) => {
      expect(resolveCollectionColor(key, "light")).not.toBe(resolveCollectionColor(key, "dark"));
    });
  });

  it("falls back safely for unknown future keys", () => {
    expect(resolveCollectionColor("future-color", "light")).toBe(
      resolveCollectionColor("orange", "light")
    );
    expect(resolveCollectionColor(undefined, "dark")).toBe(
      resolveCollectionColor("orange", "dark")
    );
  });
});
