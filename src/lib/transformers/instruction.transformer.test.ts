import { describe, it, expect } from "vitest";
import {
  instructionsToMarkdown,
  parseInstructionsMarkdown,
} from "./instruction.transformer";

describe("instructionsToMarkdown", () => {
  it("numbers steps continuously with ### headings on section change", () => {
    expect(
      instructionsToMarkdown([
        { stepText: "Simmer the tomatoes", groupName: "Sauce" },
        { stepText: "Add basil", groupName: "Sauce" },
        { stepText: "Layer and bake", groupName: "Assembly" },
      ])
    ).toBe("### Sauce\n1. Simmer the tomatoes\n2. Add basil\n### Assembly\n3. Layer and bake");
  });

  it("emits no headings without sections and skips blank steps", () => {
    expect(
      instructionsToMarkdown([
        { stepText: "Boil pasta", groupName: null },
        { stepText: "  ", groupName: null },
        { stepText: "Add sauce", groupName: null },
      ])
    ).toBe("1. Boil pasta\n2. Add sauce");
  });
});

describe("parseInstructionsMarkdown", () => {
  it("parses the dual-written format back into steps", () => {
    expect(
      parseInstructionsMarkdown("### Sauce\n1. Simmer tomatoes\n2. Add basil\n### Assembly\n3. Layer and bake")
    ).toEqual([
      { stepText: "Simmer tomatoes", groupName: "Sauce", sortOrder: 0 },
      { stepText: "Add basil", groupName: "Sauce", sortOrder: 1 },
      { stepText: "Layer and bake", groupName: "Assembly", sortOrder: 2 },
    ]);
  });

  it("merges soft-wrapped plain lines and keeps decimal-leading steps intact", () => {
    expect(
      parseInstructionsMarkdown("Mix the flour\nand water.\n\n1.5 hours later, remove it.")
    ).toEqual([
      { stepText: "Mix the flour and water.", groupName: null, sortOrder: 0 },
      { stepText: "1.5 hours later, remove it.", groupName: null, sortOrder: 1 },
    ]);
  });

  it("normalizes literal \\n sequences from old rows", () => {
    expect(parseInstructionsMarkdown("1. Bake\\n2. Frost")).toEqual([
      { stepText: "Bake", groupName: null, sortOrder: 0 },
      { stepText: "Frost", groupName: null, sortOrder: 1 },
    ]);
  });
});
