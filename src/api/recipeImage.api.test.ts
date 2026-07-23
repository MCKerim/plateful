import { describe, expect, it } from "vitest";
import { buildRecipeImagePath, isTrustedRecipeImageUrl } from "./recipeImage.api";

const PROJECT_URL = "https://upupcsgufoejppoietiu.supabase.co";

describe("buildRecipeImagePath", () => {
  it("uses immutable UUID names inside the recipe-owned folder", () => {
    expect(
      buildRecipeImagePath(
        "29A47C9F-3DA1-4E35-961D-3EE9BA1F685C",
        "117794E7-CFE5-4398-8DCB-E0503342E6CB"
      )
    ).toBe(
      "recipe_29a47c9f-3da1-4e35-961d-3ee9ba1f685c/" + "117794e7-cfe5-4398-8dcb-e0503342e6cb.jpg"
    );
  });

  it("rejects paths that cannot belong to a recipe UUID", () => {
    expect(() => buildRecipeImagePath("not-a-recipe")).toThrow("Invalid recipe image identifier");
  });
});

describe("isTrustedRecipeImageUrl", () => {
  it("allows this project's public and signed recipe image objects", () => {
    expect(
      isTrustedRecipeImageUrl(
        `${PROJECT_URL}/storage/v1/object/public/recipeimages/shared_abc/photo.jpg`,
        PROJECT_URL
      )
    ).toBe(true);
    expect(
      isTrustedRecipeImageUrl(
        `${PROJECT_URL}/storage/v1/object/sign/recipeimages/shared_abc/photo.jpg?token=example`,
        PROJECT_URL
      )
    ).toBe(true);
  });

  it.each([
    "https://example.com/storage/v1/object/public/recipeimages/shared_abc/photo.jpg",
    "https://attacker@upupcsgufoejppoietiu.supabase.co/storage/v1/object/public/recipeimages/shared_abc/photo.jpg",
    `${PROJECT_URL}/storage/v1/object/public/private-files/secret.jpg`,
    `${PROJECT_URL}/storage/v1/object/public/recipeimages/`,
    "http://upupcsgufoejppoietiu.supabase.co/storage/v1/object/public/recipeimages/shared_abc/photo.jpg",
    "not a URL",
  ])("rejects untrusted URL %s", (url) => {
    expect(isTrustedRecipeImageUrl(url, PROJECT_URL)).toBe(false);
  });
});
