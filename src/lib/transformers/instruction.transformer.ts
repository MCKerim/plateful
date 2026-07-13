import type {
  RecipeInstruction,
  RecipeInstructionInput,
  RecipeInstructionRow,
} from "@/types/instruction.types";

/**
 * Transform a database row to domain type
 */
export function transformInstruction(row: RecipeInstructionRow): RecipeInstruction {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    stepText: row.step_text,
    groupName: row.group_name,
    sortOrder: row.sort_order,
  };
}

/**
 * Transform an array of database rows to domain types
 */
export function transformInstructions(
  rows: RecipeInstructionRow[]
): RecipeInstruction[] {
  return rows.map(transformInstruction);
}

/**
 * Serialize instruction steps into the legacy markdown string kept dual-written
 * on `recipes.instructions`: continuously numbered "1." lines with a
 * "### Section" heading whenever the section changes. This is the exact format
 * the extractor server and the native iOS app emit, so every writer produces
 * identical markdown for the same steps.
 */
export function instructionsToMarkdown(
  steps: Array<Pick<RecipeInstructionInput, "stepText" | "groupName">>
): string {
  const lines: string[] = [];
  let currentSection: string | null = null;
  let number = 1;
  for (const { stepText, groupName } of steps) {
    const text = stepText.trim();
    if (!text) continue;
    const section = groupName?.trim() || null;
    if (section !== currentSection) {
      currentSection = section;
      if (section) lines.push(`### ${section}`);
    }
    lines.push(`${number}. ${text}`);
    number += 1;
  }
  return lines.join("\n");
}

const HEADING = /^#{1,6}\s+(.+?)\s*#*\s*$/;
// Numbered markers need a space (or end of line) after the dot/paren so a step
// starting with a decimal ("1.5 hours later…") isn't mistaken for "1." + text.
const LIST_ITEM = /^\s*(?:\d+[.)](?:\s+|$)|[-*•]\s+)(.*)$/;

/**
 * Parse legacy markdown instructions into step inputs, for recipes that
 * predate `recipe_instructions` rows (created by older app versions): headings
 * ("##"/"###") set the current section, numbered/bulleted lines are one step
 * each, and plain lines start a step with directly following plain lines
 * merged into it (soft wrap; a blank line ends the step). Same semantics as
 * the server-side backfill parser.
 */
export function parseInstructionsMarkdown(markdown: string): RecipeInstructionInput[] {
  const steps: RecipeInstructionInput[] = [];
  let groupName: string | null = null;
  let openParagraph = false;

  // Old rows sometimes contain literal "\n" sequences instead of real newlines.
  for (const rawLine of markdown.split("\\n").join("\n").split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*>\s?/, "").trim();
    if (!line) {
      openParagraph = false;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading?.[1]) {
      groupName = heading[1].trim() || null;
      openParagraph = false;
      continue;
    }
    const item = line.match(LIST_ITEM);
    if (item !== null) {
      const text = (item[1] ?? "").trim();
      if (text) steps.push({ stepText: text, groupName, sortOrder: steps.length });
      openParagraph = false;
      continue;
    }
    const last = steps[steps.length - 1];
    if (openParagraph && last) {
      last.stepText = `${last.stepText} ${line}`;
    } else {
      steps.push({ stepText: line, groupName, sortOrder: steps.length });
      openParagraph = true;
    }
  }
  return steps;
}
