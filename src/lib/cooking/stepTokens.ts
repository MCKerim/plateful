import type { Json } from "@/types/database.types";
import { templateSegments, validatedAnnotation, type StepAnnotation } from "@/lib/cooking/annotation";
import { scanDurations, type DurationMatch } from "@/lib/cooking/durationScanner";

/**
 * One piece of a step's text as the cooking screen lays it out. `spaceBefore`
 * says whether whitespace separated it from the previous token, so a comma
 * right after a chip hugs it. An ingredient mention is split per word (not one
 * atomic chip) so a long name wraps like prose; every word of a mention shares
 * `mentionIndex`, and only the first carries the emoji.
 */
export type StepToken =
  | { kind: "word"; text: string; spaceBefore: boolean }
  | {
      kind: "timer";
      text: string;
      spaceBefore: boolean;
      seconds: number;
      secondsMax: number | null;
      /** The name a timer started from this chip gets; chip and timer meet on it. */
      label: string;
    }
  | {
      kind: "ingredientWord";
      text: string;
      spaceBefore: boolean;
      ingredientId: string;
      emoji: string;
      mentionIndex: number;
    };

/** A timer a step offers, in reading order: what tapping its chip starts. */
export type TimerCandidate = { label: string; seconds: number; secondsMax: number | null };

/** A step ready for the screen: no tokens means plain text, nothing to chip. */
export type PreparedStep = { tokens: StepToken[]; timers: TimerCandidate[] };

const WHITESPACE = /\s/u;

function appendWords(text: string, tokens: StepToken[], pendingSpace: { value: boolean }) {
  let i = 0;
  while (i < text.length) {
    if (WHITESPACE.test(text[i])) {
      pendingSpace.value = true;
      i += 1;
      continue;
    }
    let j = i;
    while (j < text.length && !WHITESPACE.test(text[j])) j += 1;
    tokens.push({ kind: "word", text: text.slice(i, j), spaceBefore: pendingSpace.value });
    pendingSpace.value = false;
    i = j;
  }
}

/**
 * Splits `text` into word tokens and one atomic timer token per match,
 * preserving which boundaries had whitespace.
 */
export function tokenizeStep(text: string, matches: readonly DurationMatch[]): StepToken[] {
  const starts = new Map<number, DurationMatch>();
  for (const match of matches) if (!starts.has(match.start)) starts.set(match.start, match);

  const tokens: StepToken[] = [];
  let pendingSpace = false;
  let i = 0;
  while (i < text.length) {
    if (WHITESPACE.test(text[i])) {
      pendingSpace = true;
      i += 1;
      continue;
    }
    const match = starts.get(i);
    if (match) {
      tokens.push({
        kind: "timer",
        text: match.text,
        spaceBefore: pendingSpace,
        seconds: match.seconds,
        secondsMax: match.secondsMax,
        label: match.text,
      });
      pendingSpace = false;
      i = match.end;
      continue;
    }
    let j = i;
    while (j < text.length && !WHITESPACE.test(text[j]) && !starts.has(j)) j += 1;
    tokens.push({ kind: "word", text: text.slice(i, j), spaceBefore: pendingSpace });
    pendingSpace = false;
    i = j;
  }
  return tokens;
}

/**
 * Turns a validated annotation into tokens: literal template segments become
 * words, timer entities chips, ingredient mentions accent words. A mention
 * whose ingredient the recipe no longer has degrades to plain words.
 */
export function tokenizeAnnotation(
  annotation: StepAnnotation,
  ingredientIds: ReadonlySet<string>
): StepToken[] {
  const tokens: StepToken[] = [];
  const pendingSpace = { value: false };
  let mentionIndex = 0;

  for (const segment of templateSegments(annotation.template)) {
    if (segment.kind === "literal") {
      appendWords(segment.text, tokens, pendingSpace);
      continue;
    }
    const entity = annotation.entities[segment.index];
    if (!entity) continue;
    if (entity.t === "timer") {
      tokens.push({
        kind: "timer",
        text: entity.text,
        spaceBefore: pendingSpace.value,
        seconds: entity.seconds,
        secondsMax: entity.seconds_max ?? null,
        label: entity.label,
      });
      pendingSpace.value = false;
      continue;
    }
    if (!ingredientIds.has(entity.ingredient_id)) {
      appendWords(entity.text, tokens, pendingSpace);
      continue;
    }
    const before = tokens.length;
    appendWords(entity.text, tokens, pendingSpace);
    for (let k = before; k < tokens.length; k += 1) {
      const word = tokens[k];
      tokens[k] = {
        kind: "ingredientWord",
        text: word.text,
        spaceBefore: word.spaceBefore,
        ingredientId: entity.ingredient_id,
        emoji: k === before ? entity.emoji : "",
        mentionIndex,
      };
    }
    mentionIndex += 1;
  }
  return tokens;
}

/**
 * What the cooking screen needs for one step, computed once at load: chips
 * from a trusted annotation, else from the duration scan (a plain step gets no
 * tokens), and the timers those chips start.
 */
export function prepareStep(
  stepText: string,
  stored: Json | null | undefined,
  ingredientIds: ReadonlySet<string>
): PreparedStep {
  const annotation = validatedAnnotation(stored, stepText);
  if (annotation) {
    const timers: TimerCandidate[] = [];
    for (const entity of annotation.entities) {
      if (entity.t === "timer") {
        timers.push({ label: entity.label, seconds: entity.seconds, secondsMax: entity.seconds_max ?? null });
      }
    }
    return { tokens: tokenizeAnnotation(annotation, ingredientIds), timers };
  }
  const matches = scanDurations(stepText);
  return {
    tokens: matches.length === 0 ? [] : tokenizeStep(stepText, matches),
    timers: matches.map((match) => ({ label: match.text, seconds: match.seconds, secondsMax: match.secondsMax })),
  };
}
