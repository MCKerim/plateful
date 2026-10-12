import type { Json } from "@/types/database.types";
import {
  parseStoredAnnotation,
  reconstructs,
  type StoredStepAnnotation,
} from "@/lib/transformers/recipeShare.transformer";

/** A stored annotation that passed `validatedAnnotation`, safe to render chips from. */
export type StepAnnotation = StoredStepAnnotation;

export type TemplateSegment =
  | { kind: "literal"; text: string }
  | { kind: "placeholder"; index: number };

const PLACEHOLDER = /\{(\d+)\}/g;

/** Splits a template at its `{n}` placeholders; braces that don't form `{digits}` stay literal. */
export function templateSegments(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let last = 0;
  for (const match of template.matchAll(PLACEHOLDER)) {
    if (match.index > last) segments.push({ kind: "literal", text: template.slice(last, match.index) });
    segments.push({ kind: "placeholder", index: Number(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < template.length) segments.push({ kind: "literal", text: template.slice(last) });
  return segments;
}

/**
 * The step's annotation only when it can be trusted for chips: version 1, at
 * least one entity, no entity type this client doesn't know, every entity used
 * by exactly one placeholder, and the entity texts put back into the template
 * rebuild `stepText` character for character. Anything else renders plain and
 * falls back to the duration scan, never a wrong chip. Mirrors the iOS
 * `StepAnnotation.validated(against:)`.
 */
export function validatedAnnotation(
  stored: Json | null | undefined,
  stepText: string
): StepAnnotation | null {
  const parsed = parseStoredAnnotation(stored);
  if (!parsed || parsed.entities.length === 0) return null;
  const texts = parsed.entities.map((entity) => entity.text);
  return reconstructs(parsed.template, texts, stepText) ? parsed : null;
}
