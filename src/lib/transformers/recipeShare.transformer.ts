import type { Json } from "@/types/database.types";
import type { NutritionValues } from "@/api/nutrition.api";
import type {
  SharedRecipeSnapshot,
  SnapshotAnnotationEntity,
  SnapshotStepAnnotation,
} from "@/types/recipeShare.types";

/**
 * The stored `recipe_instructions.annotation` shape (v1) — the extractor's
 * contract, mirrored here only for the share import's write. Clients never
 * author annotations; the import copies what the extractor produced for the
 * sharer, with ingredient mentions re-pointed at the imported rows.
 */
export type StoredAnnotationEntity =
  | { t: "ing"; ingredient_id: string; text: string; emoji: string; amount: boolean }
  | { t: "timer"; seconds: number; seconds_max?: number; text: string; label: string };

export type StoredStepAnnotation = {
  v: 1;
  template: string;
  entities: StoredAnnotationEntity[];
};

const PLACEHOLDER = /\{(\d+)\}/g;

/**
 * The core invariant of an annotation: every entity referenced by exactly one
 * placeholder, and the template with each entity's text substituted back must
 * equal the step text character for character. Mirrors the extractor's
 * validator and the iOS `StepAnnotation.validated(against:)`.
 */
function reconstructs(template: string, texts: string[], stepText: string): boolean {
  const seen = new Set<number>();
  for (const match of template.matchAll(PLACEHOLDER)) {
    const index = Number(match[1]);
    if (index >= texts.length || seen.has(index)) return false;
    seen.add(index);
  }
  if (seen.size !== texts.length) return false;
  return template.replace(PLACEHOLDER, (_, digits: string) => texts[Number(digits)] ?? "") === stepText;
}

/**
 * Rewrites a stored annotation for the share snapshot, or `null` when it isn't
 * worth shipping: a version this client doesn't know, an entity type it doesn't
 * know, a mention of an ingredient the recipe no longer has, or a template
 * that no longer reconstructs the step (the recipient would discard it at
 * render anyway). The "processed, nothing to mark" marker — no entities —
 * ships as it is, so the recipient's copy counts as annotated too.
 *
 * `ingredientIndexById` maps the recipe's ingredient row ids to their
 * position in the snapshot's `ingredients`.
 */
export function toSnapshotAnnotation(
  stored: Json | null | undefined,
  stepText: string,
  ingredientIndexById: ReadonlyMap<string, number>
): SnapshotStepAnnotation | null {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const { v, template, entities } = stored as { v?: unknown; template?: unknown; entities?: unknown };
  if (v !== 1 || typeof template !== "string" || !Array.isArray(entities)) return null;

  const rewritten: SnapshotAnnotationEntity[] = [];
  for (const raw of entities) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const entity = raw as Record<string, unknown>;
    if (typeof entity.text !== "string") return null;
    if (entity.t === "ing") {
      const index =
        typeof entity.ingredient_id === "string"
          ? ingredientIndexById.get(entity.ingredient_id)
          : undefined;
      if (index === undefined) return null;
      rewritten.push({
        t: "ing",
        ingredient_index: index,
        text: entity.text,
        emoji: typeof entity.emoji === "string" ? entity.emoji : "",
        amount: entity.amount === true,
      });
    } else if (entity.t === "timer") {
      if (typeof entity.seconds !== "number" || typeof entity.label !== "string") return null;
      rewritten.push({
        t: "timer",
        seconds: entity.seconds,
        seconds_max: typeof entity.seconds_max === "number" ? entity.seconds_max : null,
        text: entity.text,
        label: entity.label,
      });
    } else {
      return null;
    }
  }

  if (
    rewritten.length > 0 &&
    !reconstructs(
      template,
      rewritten.map((entity) => entity.text),
      stepText
    )
  ) {
    return null;
  }
  return { v: 1, template, entities: rewritten };
}

/**
 * The stored form for an imported step, positions resolved against the minted
 * ingredient row ids (`ingredientIds[i]` is the row for `ingredients[i]`).
 * `null` — the step is written without an annotation and renders plain on iOS
 * — when a position has no row or an entity is incomplete or unknown, as in a
 * snapshot from a newer client.
 */
export function toStoredAnnotation(
  annotation: SnapshotStepAnnotation | null | undefined,
  ingredientIds: readonly string[]
): StoredStepAnnotation | null {
  if (!annotation || annotation.v !== 1 || typeof annotation.template !== "string") return null;
  if (!Array.isArray(annotation.entities)) return null;

  const entities: StoredAnnotationEntity[] = [];
  for (const entity of annotation.entities) {
    if (typeof entity?.text !== "string") return null;
    if (entity.t === "ing") {
      const ingredientId =
        typeof entity.ingredient_index === "number"
          ? ingredientIds[entity.ingredient_index]
          : undefined;
      if (!ingredientId) return null;
      entities.push({
        t: "ing",
        ingredient_id: ingredientId,
        text: entity.text,
        emoji: typeof entity.emoji === "string" ? entity.emoji : "",
        amount: entity.amount === true,
      });
    } else if (entity.t === "timer") {
      if (typeof entity.seconds !== "number" || typeof entity.label !== "string") return null;
      const timer: StoredAnnotationEntity = {
        t: "timer",
        seconds: entity.seconds,
        text: entity.text,
        label: entity.label,
      };
      // Written only as a real upper bound, the way the extractor stores it.
      if (typeof entity.seconds_max === "number" && entity.seconds_max > entity.seconds) {
        timer.seconds_max = entity.seconds_max;
      }
      entities.push(timer);
    } else {
      return null;
    }
  }
  return { v: 1, template: annotation.template, entities };
}

/**
 * The seven nutrition columns of a recipe row as a snapshot value, or `null`
 * when nothing has been calculated (the key is then left out of the snapshot
 * and the recipient estimates afresh).
 */
export function nutritionForSnapshot(row: NutritionValues): NutritionValues | null {
  const values = normalizeNutrition(row);
  return Object.values(values).some((value) => value !== null) ? values : null;
}

/**
 * A snapshot's nutrition as the full seven-key row shape the card and the
 * recipe insert expect, or `null` when the snapshot carries no values (older
 * snapshots omit the key; a sparse object from another client is tolerated).
 */
export function snapshotNutrition(
  snapshot: Pick<SharedRecipeSnapshot, "nutrition">
): NutritionValues | null {
  if (!snapshot.nutrition || typeof snapshot.nutrition !== "object") return null;
  return nutritionForSnapshot(snapshot.nutrition);
}

function normalizeNutrition(values: Partial<NutritionValues>): NutritionValues {
  return {
    calories_kcal: numberOrNull(values.calories_kcal),
    carbs_g: numberOrNull(values.carbs_g),
    protein_g: numberOrNull(values.protein_g),
    fat_g: numberOrNull(values.fat_g),
    sugar_g: numberOrNull(values.sugar_g),
    fiber_g: numberOrNull(values.fiber_g),
    sodium_mg: numberOrNull(values.sodium_mg),
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
