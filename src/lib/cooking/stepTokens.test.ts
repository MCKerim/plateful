import { describe, expect, it } from "vitest";
import { templateSegments, validatedAnnotation } from "@/lib/cooking/annotation";
import { scanDurations } from "@/lib/cooking/durationScanner";
import { prepareStep, tokenizeAnnotation, tokenizeStep, type StepToken } from "@/lib/cooking/stepTokens";

const word = (token: StepToken) => (token.kind === "word" ? token.text : null);
const isTimer = (token: StepToken) => token.kind === "timer";

const STEP = "Beat in the eggs one at a time, then fold in the 250 g flour and rest for 10 minutes.";
const ANNOTATION = {
  v: 1,
  template: "Beat in the {0} one at a time, then fold in the {1} and rest for {2}.",
  entities: [
    { t: "ing", ingredient_id: "i2", text: "eggs", emoji: "🥚", amount: false },
    { t: "ing", ingredient_id: "i1", text: "250 g flour", emoji: "🌾", amount: true },
    { t: "timer", seconds: 600, text: "10 minutes", label: "Rest the batter" },
  ],
};
const INGREDIENTS = new Set(["i1", "i2"]);

describe("tokenizeStep", () => {
  it("makes a timer phrase one token and keeps the spacing around it", () => {
    const text = "Bring to a simmer for 10 minutes, then rest.";
    const tokens = tokenizeStep(text, scanDurations(text));

    expect(word(tokens[0])).toBe("Bring");
    const timerIndex = tokens.findIndex(isTimer);
    const timer = tokens[timerIndex];
    expect(timer.kind === "timer" && timer.text).toBe("10 minutes");
    expect(timer.kind === "timer" && timer.label).toBe("10 minutes");
    expect(timer.spaceBefore).toBe(true);
    expect(word(tokens[timerIndex + 1])).toBe(",");
    expect(tokens[timerIndex + 1].spaceBefore).toBe(false);
  });

  it("yields only words without matches", () => {
    const tokens = tokenizeStep("Season the steak well.", []);
    expect(tokens.map(word)).toEqual(["Season", "the", "steak", "well."]);
  });

  it("tokenizes each of several timers", () => {
    const text = "Sauté 3 minutes, then simmer 20 minutes.";
    expect(tokenizeStep(text, scanDurations(text)).filter(isTimer)).toHaveLength(2);
  });
});

describe("annotation", () => {
  it("splits a template into literals and placeholders, keeping stray braces literal", () => {
    expect(templateSegments("Add {0} to {1}.")).toEqual([
      { kind: "literal", text: "Add " },
      { kind: "placeholder", index: 0 },
      { kind: "literal", text: " to " },
      { kind: "placeholder", index: 1 },
      { kind: "literal", text: "." },
    ]);
    expect(templateSegments("{a} {0}")).toEqual([
      { kind: "literal", text: "{a} " },
      { kind: "placeholder", index: 0 },
    ]);
  });

  it("trusts an annotation only when its texts rebuild the step", () => {
    expect(validatedAnnotation(ANNOTATION, STEP)).not.toBeNull();
    expect(validatedAnnotation(ANNOTATION, "Beat in the eggs.")).toBeNull();
    expect(validatedAnnotation({ ...ANNOTATION, v: 2 }, STEP)).toBeNull();
    expect(validatedAnnotation({ v: 1, template: STEP, entities: [] }, STEP)).toBeNull();
    expect(validatedAnnotation(null, STEP)).toBeNull();
    expect(
      validatedAnnotation(
        { ...ANNOTATION, entities: [...ANNOTATION.entities, { t: "future", text: "" }] },
        STEP
      )
    ).toBeNull();
    expect(
      validatedAnnotation(
        { ...ANNOTATION, template: "Beat in the {0} one at a time, then fold in the {0} and rest for {2}." },
        STEP
      )
    ).toBeNull();
  });

  it("renders mentions per word with the emoji on the first, timers as chips", () => {
    const annotation = validatedAnnotation(ANNOTATION, STEP);
    if (!annotation) throw new Error("annotation should validate");
    const tokens = tokenizeAnnotation(annotation, INGREDIENTS);

    const flour = tokens.filter((token) => token.kind === "ingredientWord" && token.ingredientId === "i1");
    expect(flour.map((token) => token.text)).toEqual(["250", "g", "flour"]);
    expect(flour.map((token) => token.kind === "ingredientWord" && token.emoji)).toEqual(["🌾", "", ""]);
    expect(new Set(flour.map((token) => token.kind === "ingredientWord" && token.mentionIndex))).toEqual(new Set([1]));

    const timer = tokens.find(isTimer);
    expect(timer?.kind === "timer" && timer.label).toBe("Rest the batter");
    expect(timer?.spaceBefore).toBe(true);
    expect(word(tokens[tokens.length - 1])).toBe(".");
    expect(tokens[tokens.length - 1].spaceBefore).toBe(false);
  });

  it("degrades a mention of a deleted ingredient to plain words", () => {
    const annotation = validatedAnnotation(ANNOTATION, STEP);
    if (!annotation) throw new Error("annotation should validate");
    const tokens = tokenizeAnnotation(annotation, new Set(["i1"]));
    expect(tokens.filter((token) => token.kind === "ingredientWord" && token.ingredientId === "i2")).toHaveLength(0);
    expect(tokens.map((token) => token.text).join(" ")).toContain("the eggs one");
  });
});

describe("prepareStep", () => {
  it("prefers the annotation's chips and timers", () => {
    const prepared = prepareStep(STEP, ANNOTATION, INGREDIENTS);
    expect(prepared.timers).toEqual([{ label: "Rest the batter", seconds: 600, secondsMax: null }]);
    expect(prepared.tokens.some((token) => token.kind === "ingredientWord")).toBe(true);
  });

  it("falls back to the duration scan for an untrusted annotation", () => {
    const prepared = prepareStep(STEP, { ...ANNOTATION, v: 2 }, INGREDIENTS);
    expect(prepared.timers).toEqual([{ label: "10 minutes", seconds: 600, secondsMax: null }]);
    expect(prepared.tokens.some((token) => token.kind === "ingredientWord")).toBe(false);
  });

  it("leaves a step without durations plain", () => {
    expect(prepareStep("Season the steak well.", null, INGREDIENTS)).toEqual({ tokens: [], timers: [] });
  });
});
