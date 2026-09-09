import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEEK_START,
  deviceWeekStart,
  intlFirstDayToWeekStart,
  weekdayOrder,
} from "./weekStart";

describe("intlFirstDayToWeekStart", () => {
  it("maps Intl's 1 = Monday .. 7 = Sunday onto the server's 0 = Sunday", () => {
    expect(intlFirstDayToWeekStart(1)).toBe(1);
    expect(intlFirstDayToWeekStart(6)).toBe(6);
    expect(intlFirstDayToWeekStart(7)).toBe(0);
  });
});

describe("weekdayOrder", () => {
  it("lists the seven days from the given start in the server's numbering", () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOrder(6)).toEqual([6, 0, 1, 2, 3, 4, 5]);
    expect(weekdayOrder(8)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe("deviceWeekStart", () => {
  const engineKnowsWeeks =
    typeof (new Intl.Locale("en-US") as { getWeekInfo?: unknown }).getWeekInfo === "function" ||
    "weekInfo" in new Intl.Locale("en-US");

  it("reads Sunday for a US locale where the engine has week info, Monday otherwise", () => {
    expect(deviceWeekStart("en-US")).toBe(engineKnowsWeeks ? 0 : DEFAULT_WEEK_START);
  });

  it("reads Monday for a German locale", () => {
    expect(deviceWeekStart("de-DE")).toBe(1);
  });

  it("falls back to Monday for a tag that does not parse or an empty one", () => {
    expect(deviceWeekStart("not a locale !!!")).toBe(DEFAULT_WEEK_START);
    expect(deviceWeekStart("")).toBe(DEFAULT_WEEK_START);
  });
});
