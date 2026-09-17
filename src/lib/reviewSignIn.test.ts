import { describe, expect, it } from "vitest";
import { REVIEW_EMAILS, isReviewEmail } from "./reviewSignIn";

describe("isReviewEmail", () => {
  it("matches every review address as typed", () => {
    for (const address of REVIEW_EMAILS) {
      expect(isReviewEmail(address)).toBe(true);
    }
  });

  it("matches a pasted address with different case and stray whitespace", () => {
    expect(isReviewEmail("  AndroidReview@Plateful.Test ")).toBe(true);
    expect(isReviewEmail(" ChatGPTReview@Plateful.Test  ")).toBe(true);
  });

  it("does not match anyone else", () => {
    expect(isReviewEmail("androidreview@plateful.tes")).toBe(false);
    expect(isReviewEmail("chatgptreview@plateful.com")).toBe(false);
    expect(isReviewEmail("someone@example.com")).toBe(false);
    expect(isReviewEmail("")).toBe(false);
  });
});
