import { describe, it, expect, vi } from "vitest";
import {
  categories,
  getTranslatedCategory,
  getCategoryIdByTranslatedEnglishName,
} from "./recipeCategoryHelper";

describe("recipeCategoryHelper", () => {
  describe("categories constant", () => {
    it("should have 5 categories", () => {
      expect(categories).toHaveLength(5);
    });

    it("should have required properties for each category", () => {
      categories.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("color");
        expect(category).toHaveProperty("engTranslation");
      });
    });

    it("should have unique ids", () => {
      const ids = categories.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should have ids from 1 to 5", () => {
      const ids = categories.map((c) => c.id).sort();
      expect(ids).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("getTranslatedCategory", () => {
    it("should call translation function with correct key for category 1", () => {
      const mockT = vi.fn((key: string) => key);
      getTranslatedCategory(mockT, 1);
      expect(mockT).toHaveBeenCalledWith("categorys.category1");
    });

    it("should call translation function with correct key for category 2", () => {
      const mockT = vi.fn((key: string) => key);
      getTranslatedCategory(mockT, 2);
      expect(mockT).toHaveBeenCalledWith("categorys.category2");
    });

    it("should return undefined key for non-existent category", () => {
      const mockT = vi.fn((key: string) => key);
      getTranslatedCategory(mockT, 999);
      expect(mockT).toHaveBeenCalledWith("categorys.undefined");
    });

    it("should return the translated value from the t function", () => {
      const mockT = vi.fn(() => "Frühstück");
      const result = getTranslatedCategory(mockT, 1);
      expect(result).toBe("Frühstück");
    });
  });

  describe("getCategoryIdByTranslatedEnglishName", () => {
    it("should return correct id for Breakfast", () => {
      expect(getCategoryIdByTranslatedEnglishName("Breakfast")).toBe(1);
    });

    it("should return correct id for Main Course", () => {
      expect(getCategoryIdByTranslatedEnglishName("Main Course")).toBe(2);
    });

    it("should return correct id for Dessert", () => {
      expect(getCategoryIdByTranslatedEnglishName("Dessert")).toBe(3);
    });

    it("should return correct id for Drinks", () => {
      expect(getCategoryIdByTranslatedEnglishName("Drinks")).toBe(4);
    });

    it("should return correct id for Other", () => {
      expect(getCategoryIdByTranslatedEnglishName("Other")).toBe(5);
    });

    it("should return null for unknown category", () => {
      expect(getCategoryIdByTranslatedEnglishName("Unknown")).toBeNull();
    });

    it("should be case-sensitive", () => {
      expect(getCategoryIdByTranslatedEnglishName("breakfast")).toBeNull();
      expect(getCategoryIdByTranslatedEnglishName("BREAKFAST")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(getCategoryIdByTranslatedEnglishName("")).toBeNull();
    });
  });
});
