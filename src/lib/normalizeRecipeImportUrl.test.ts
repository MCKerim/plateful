import { describe, expect, it } from "vitest";
import { MAX_RECIPE_IMPORT_URL_LENGTH, normalizeRecipeImportUrl } from "./normalizeRecipeImportUrl";

describe("normalizeRecipeImportUrl", () => {
  it("adds HTTPS when the scheme is missing", () => {
    expect(normalizeRecipeImportUrl("example.com/recipe")).toBe("https://example.com/recipe");
  });

  it("upgrades an explicit HTTP link", () => {
    expect(normalizeRecipeImportUrl("http://example.com/recipe")).toBe(
      "https://example.com/recipe"
    );
  });

  it("rejects credentials and non-standard ports", () => {
    expect(normalizeRecipeImportUrl("https://user:secret@example.com/recipe")).toBeNull();
    expect(normalizeRecipeImportUrl("https://example.com:8443/recipe")).toBeNull();
  });

  it("rejects local and oversized URLs", () => {
    expect(normalizeRecipeImportUrl("https://localhost/recipe")).toBeNull();
    expect(
      normalizeRecipeImportUrl(`https://example.com/${"a".repeat(MAX_RECIPE_IMPORT_URL_LENGTH)}`)
    ).toBeNull();
  });
});
