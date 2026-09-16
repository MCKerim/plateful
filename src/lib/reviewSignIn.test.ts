import { describe, expect, it } from "vitest";
import { REVIEW_EMAIL, isReviewEmail } from "./reviewSignIn";

describe("isReviewEmail", () => {
  it("matches the review address as typed", () => {
    expect(isReviewEmail(REVIEW_EMAIL)).toBe(true);
  });

  it("matches a pasted address with different case and stray whitespace", () => {
    expect(isReviewEmail("  AndroidReview@Plateful.Test ")).toBe(true);
  });

  it("does not match anyone else", () => {
    expect(isReviewEmail("androidreview@plateful.tes")).toBe(false);
    expect(isReviewEmail("someone@example.com")).toBe(false);
    expect(isReviewEmail("")).toBe(false);
  });
});
