import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getMealPlanStatus } from "./mealPlanHelper";
import type { RecipeMealPlanInfo } from "@/types/meal-planning.types";

describe("mealPlanHelper", () => {
  // Create a mock translation function that returns the key with count if provided
  const mockT = vi.fn((key: string, options?: { count?: number }): string => {
    if (options?.count !== undefined) {
      return `${key}_${options.count}`;
    }
    return key;
  }) as unknown as Parameters<typeof getMealPlanStatus>[1];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0)); // June 15, 2024 at noon
    vi.mocked(mockT).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getMealPlanStatus", () => {
    it('should return "-" for null info', () => {
      expect(getMealPlanStatus(null, mockT)).toBe("-");
    });

    it('should return "-" when no active plan and no last planned date', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: null,
      };
      expect(getMealPlanStatus(info, mockT)).toBe("-");
    });

    it('should return "common.planned" for active plan without date', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: null,
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: null,
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.planned");
    });

    it('should return "common.today" for plan scheduled today', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: "2024-06-15",
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: null,
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.today");
    });

    it('should return "common.tomorrow" for plan scheduled tomorrow', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: "2024-06-16",
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: null,
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.tomorrow");
    });

    it("should return days count for future plans (3 days)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: "2024-06-18", // 3 days from now
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: null,
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.inDays_3");
    });

    it("should return days count for future plans (5 days)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: "2024-06-20", // 5 days from now
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: null,
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.inDays_5");
    });

    it('should return "common.yesterday" for last planned yesterday', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-06-14",
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.yesterday");
    });

    it("should return days ago for 2-6 days in the past", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-06-12", // 3 days ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.daysAgo_3");
    });

    it("should return weeks ago for 7-13 days (1 week)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-06-08", // 7 days ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.weeksAgo_1");
    });

    it("should return weeks ago for 14-20 days (2 weeks)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-06-01", // 14 days ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.weeksAgo_2");
    });

    it("should return months ago for 30-59 days (1 month)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-05-15", // ~31 days ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.monthsAgo_1");
    });

    it("should return months ago for 90-119 days (3 months)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-03-15", // ~92 days ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.monthsAgo_3");
    });

    it("should return years ago for 365+ days (1 year)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2023-06-15", // 1 year ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.yearsAgo_1");
    });

    it("should return years ago for 730+ days (2 years)", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2022-06-15", // 2 years ago
      };
      const result = getMealPlanStatus(info, mockT);
      expect(result).toBe("common.yearsAgo_2");
    });

    it("should prioritize active plan over last planned date", () => {
      const info: RecipeMealPlanInfo = {
        activePlan: {
          id: 1,
          planned_date: "2024-06-16",
          days: 1,
          daysEaten: 0,
        },
        lastPlannedDate: "2024-06-10", // This should be ignored
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.tomorrow");
    });

    it('should return "common.today" when last planned date is today (no active plan)', () => {
      const info: RecipeMealPlanInfo = {
        activePlan: null,
        lastPlannedDate: "2024-06-15", // today
      };
      expect(getMealPlanStatus(info, mockT)).toBe("common.today");
    });
  });
});
