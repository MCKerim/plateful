import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getWeekdays, toPlannedDateString, toWeekday, weekStartsOn } from "./dateHelper";

// Mock i18n module
vi.mock("@/i18n", () => ({
  default: {
    language: "en",
  },
}));

describe("dateHelper", () => {
  describe("toWeekday", () => {
    beforeEach(() => {
      // Mock current date to June 15, 2024 (Saturday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Today" for current date', () => {
      const today = new Date(2024, 5, 15);
      const result = toWeekday(today);
      expect(result).toContain("Today");
      expect(result).toContain("15.06.2024");
    });

    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date(2024, 5, 14);
      const result = toWeekday(yesterday);
      expect(result).toContain("Yesterday");
      expect(result).toContain("14.06.2024");
    });

    it('should return "Tomorrow" for next day', () => {
      const tomorrow = new Date(2024, 5, 16);
      const result = toWeekday(tomorrow);
      expect(result).toContain("Tomorrow");
      expect(result).toContain("16.06.2024");
    });

    it('should return "last " prefix for past dates beyond yesterday', () => {
      const pastDate = new Date(2024, 5, 10); // Monday June 10
      const result = toWeekday(pastDate);
      expect(result).toContain("last Monday");
      expect(result).toContain("10.06.2024");
    });

    it("should return weekday name without prefix for future dates beyond tomorrow", () => {
      const futureDate = new Date(2024, 5, 20); // Thursday June 20
      const result = toWeekday(futureDate);
      expect(result).toContain("Thursday");
      expect(result).not.toContain("last");
      expect(result).toContain("20.06.2024");
    });

    it("should format date with leading zeros for single-digit days", () => {
      const date = new Date(2024, 0, 5); // January 5
      const result = toWeekday(date);
      expect(result).toContain("05.01.2024");
    });

    it("should format date with leading zeros for single-digit months", () => {
      const date = new Date(2024, 2, 15); // March 15
      const result = toWeekday(date);
      expect(result).toContain("15.03.2024");
    });

    it("should include bullet separator between day name and date", () => {
      const today = new Date(2024, 5, 15);
      const result = toWeekday(today);
      expect(result).toContain(" • ");
    });
  });

  describe("getWeekdays", () => {
    it("should return 7 days", () => {
      const result = getWeekdays(new Date(2024, 5, 15), 1);
      expect(result).toHaveLength(7);
    });

    it("should start from Monday (day 1)", () => {
      const result = getWeekdays(new Date(2024, 5, 15), 1); // Saturday
      expect(result[0].getDay()).toBe(1); // Monday
    });

    it("should end on Sunday (day 0)", () => {
      const result = getWeekdays(new Date(2024, 5, 15), 1);
      expect(result[6].getDay()).toBe(0); // Sunday
    });

    it("should return correct week when given a Monday", () => {
      const monday = new Date(2024, 5, 10); // June 10, 2024 (Monday)
      const result = getWeekdays(monday, 1);
      expect(result[0].getDate()).toBe(10);
      expect(result[6].getDate()).toBe(16);
    });

    it("should return correct week when given a Sunday", () => {
      const sunday = new Date(2024, 5, 16); // June 16, 2024 (Sunday)
      const result = getWeekdays(sunday, 1);
      expect(result[0].getDate()).toBe(10); // Monday June 10
      expect(result[6].getDate()).toBe(16); // Sunday June 16
    });

    it("should return correct week when given a Wednesday", () => {
      const wednesday = new Date(2024, 5, 12); // June 12, 2024 (Wednesday)
      const result = getWeekdays(wednesday, 1);
      expect(result[0].getDate()).toBe(10); // Monday June 10
      expect(result[6].getDate()).toBe(16); // Sunday June 16
    });

    it("should handle week spanning two months", () => {
      const date = new Date(2024, 5, 30); // June 30, 2024 (Sunday)
      const result = getWeekdays(date, 1);
      expect(result[0].getMonth()).toBe(5); // June
      expect(result[6].getMonth()).toBe(5); // June (June 30 is Sunday)
    });

    it("should handle week at year boundary", () => {
      const date = new Date(2024, 0, 1); // January 1, 2024 (Monday)
      const result = getWeekdays(date, 1);
      expect(result[0].getDate()).toBe(1);
      expect(result[0].getMonth()).toBe(0); // January
    });

    it("starts on Sunday for a Sunday-first account", () => {
      const saturday = new Date(2024, 5, 15); // June 15, 2024 (Saturday)
      const result = getWeekdays(saturday, 0);
      expect(result[0].getDay()).toBe(0);
      expect(result[0].getDate()).toBe(9); // Sunday June 9
      expect(result[6].getDate()).toBe(15); // Saturday June 15
    });

    it("puts a Sunday at the start of a Sunday-first week and the end of a Monday-first one", () => {
      const sunday = new Date(2024, 5, 16); // June 16, 2024 (Sunday)
      expect(getWeekdays(sunday, 0)[0].getDate()).toBe(16);
      expect(getWeekdays(sunday, 1)[0].getDate()).toBe(10);
    });

    it("starts on any weekday the account asks for", () => {
      const saturday = new Date(2024, 5, 15); // June 15, 2024 (Saturday)
      const result = getWeekdays(saturday, 3); // Wednesday
      expect(result[0].getDay()).toBe(3);
      expect(result[0].getDate()).toBe(12); // Wednesday June 12
      expect(result[6].getDate()).toBe(18); // Tuesday June 18
    });

    it("should return Date objects, not strings", () => {
      const result = getWeekdays(new Date(2024, 5, 15), 1);
      result.forEach((day) => {
        expect(day).toBeInstanceOf(Date);
      });
    });
  });

  describe("formatDateByLocale", () => {
    beforeEach(async () => {
      // Reset the mock before each test
      vi.resetModules();
    });

    it("should format date in English locale (MM/dd/yyyy)", async () => {
      vi.doMock("@/i18n", () => ({
        default: { language: "en" },
      }));
      const { formatDateByLocale: formatEn } = await import("./dateHelper");

      const result = formatEn(new Date(2024, 5, 15));

      expect(result).toBe("06/15/2024");
    });

    it("should format date in German locale (dd.MM.yyyy)", async () => {
      vi.doMock("@/i18n", () => ({
        default: { language: "de" },
      }));
      const { formatDateByLocale: formatDe } = await import("./dateHelper");

      const result = formatDe(new Date(2024, 5, 15));

      expect(result).toBe("15.06.2024");
    });

    it("should accept string date input", async () => {
      vi.doMock("@/i18n", () => ({
        default: { language: "en" },
      }));
      const { formatDateByLocale: formatEn } = await import("./dateHelper");

      const result = formatEn("2024-06-15");

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});

describe("weekStartsOn", () => {
  it("wraps into date-fns' 0..6", () => {
    expect(weekStartsOn(0)).toBe(0);
    expect(weekStartsOn(6)).toBe(6);
    expect(weekStartsOn(8)).toBe(1);
  });
});

describe("toPlannedDateString", () => {
  it("names the local calendar day, whatever the time of day", () => {
    expect(toPlannedDateString(new Date(2026, 8, 7, 0, 30))).toBe("2026-09-07");
    expect(toPlannedDateString(new Date(2026, 8, 7, 23, 30))).toBe("2026-09-07");
  });

  it("zero-pads month and day", () => {
    expect(toPlannedDateString(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});
