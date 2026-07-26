import { describe, expect, it } from "vitest";
import type { RecipeRatingWithUser } from "./RatingModal";
import { ratingAuthorLabel } from "@/lib/ratingAuthorLabel";

const rating = {
  id: "rating-id",
  recipe_id: "recipe-id",
  owner_id: "former-user-id",
  stars: 5,
  note: "Keep this note.",
  created_at: "2026-07-26T12:00:00Z",
  users: null,
} as RecipeRatingWithUser;

describe("ratingAuthorLabel", () => {
  it("labels a retained rating whose author is hidden by household RLS", () => {
    expect(ratingAuthorLabel(rating, "Former member")).toBe("Former member");
  });

  it("uses the visible current member username", () => {
    expect(ratingAuthorLabel({ ...rating, users: { username: "Mara" } }, "Former member")).toBe(
      "Mara"
    );
  });
});
