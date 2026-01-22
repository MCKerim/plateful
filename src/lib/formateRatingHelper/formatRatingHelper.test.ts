import { describe, it, expect } from "vitest";
import { formatRating } from "./formatRatingHelper";

describe("formatRatingHelper", () => {
  describe("formatRating", () => {
    it("should return dash for null rating", () => {
      expect(formatRating(null)).toBe("-");
    });

    it("should return dash for NaN rating", () => {
      expect(formatRating(NaN)).toBe("-");
    });

    it("should format integer rating with one decimal", () => {
      expect(formatRating(4)).toBe("4.0");
    });

    it("should format decimal rating with one decimal", () => {
      expect(formatRating(4.5)).toBe("4.5");
    });

    it("should round to one decimal place", () => {
      expect(formatRating(4.567)).toBe("4.6");
    });

    it("should handle zero", () => {
      expect(formatRating(0)).toBe("0.0");
    });

    it("should handle negative numbers", () => {
      expect(formatRating(-1.5)).toBe("-1.5");
    });

    it("should handle maximum rating value", () => {
      expect(formatRating(5)).toBe("5.0");
    });

    it("should handle minimum rating value", () => {
      expect(formatRating(1)).toBe("1.0");
    });
  });
});
