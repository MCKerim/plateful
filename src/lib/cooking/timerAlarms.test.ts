import { describe, expect, it } from "vitest";
import { alarmId } from "@/lib/cooking/timerAlarms";

describe("alarmId", () => {
  it("is stable, positive and tells timers apart", () => {
    const a = alarmId("eeeeeeee-5555-5555-5555-555555555555");
    expect(alarmId("eeeeeeee-5555-5555-5555-555555555555")).toBe(a);
    expect(a).toBeGreaterThan(0);
    expect(Number.isInteger(a)).toBe(true);
    expect(alarmId("eeeeeeee-5555-5555-5555-555555555556")).not.toBe(a);
  });
});
