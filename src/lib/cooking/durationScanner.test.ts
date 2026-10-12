import { describe, expect, it } from "vitest";
import { parseDurationValue, scanDurations } from "@/lib/cooking/durationScanner";

describe("scanDurations", () => {
  it("finds English and German durations with their spans", () => {
    const text = "Simmer for 10 minutes, dann 2 Stunden ruhen lassen.";
    const matches = scanDurations(text);
    expect(matches.map((match) => match.text)).toEqual(["10 minutes", "2 Stunden"]);
    expect(matches.map((match) => match.seconds)).toEqual([600, 7200]);
    expect(text.slice(matches[0].start, matches[0].end)).toBe("10 minutes");
  });

  it("reads ranges as low end plus a maximum", () => {
    const [match] = scanDurations("Bake 4–5 Minuten");
    expect(match.seconds).toBe(240);
    expect(match.secondsMax).toBe(300);
    expect(scanDurations("Bake 5 to 5 minutes")[0].secondsMax).toBeNull();
  });

  it("understands fractions, decimals with a comma, and bare hours", () => {
    expect(scanDurations("rest 1½ hours")[0].seconds).toBe(5400);
    expect(scanDurations("rest 1 1/2 hours")[0].seconds).toBe(5400);
    expect(scanDurations("simmer 2,5 min")[0].seconds).toBe(150);
    expect(scanDurations("marinate 2h")[0].seconds).toBe(7200);
    expect(scanDurations("1 Std. ruhen")[0].text).toBe("1 Std.");
  });

  it("keeps the trailing period of 'min.' and ignores non-time numbers", () => {
    expect(scanDurations("Cook 5 min. more")[0].text).toBe("5 min.");
    expect(scanDurations("Bake at 180°C with 200 g flour on a 20 cm tin")).toEqual([]);
    expect(scanDurations("a minute later")).toEqual([]);
  });

  it("does not let 'minute' steal 'Minuten' or match inside a word", () => {
    expect(scanDurations("5 Minuten")[0].text).toBe("5 Minuten");
    expect(scanDurations("5 minutesque")).toEqual([]);
  });

  it("parses number tokens", () => {
    expect(parseDurationValue("½")).toBe(0.5);
    expect(parseDurationValue("1½")).toBe(1.5);
    expect(parseDurationValue("3/4")).toBe(0.75);
    expect(parseDurationValue("2 1/4")).toBe(2.25);
    expect(parseDurationValue("1,5")).toBe(1.5);
    expect(parseDurationValue("")).toBeNull();
    expect(parseDurationValue("1/0")).toBeNull();
  });
});
