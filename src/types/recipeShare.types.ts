import type { NutritionValues } from "@/api/nutrition.api";

export type SnapshotIngredient = {
  raw_text: string;
  quantity_value: number | null;
  quantity_display: string | null;
  unit: string | null;
  ingredient_name: string | null;
  group_name: string | null;
  sort_order: number;
  is_scalable: boolean | null;
  is_optional: boolean | null;
  preparation_note: string | null;
};

/**
 * One entity of a snapshot step annotation. The stored shape (the extractor's
 * `recipe_instructions.annotation` contract, v1), except that an ingredient
 * mention carries `ingredient_index` — its position in the snapshot's
 * `ingredients` — instead of a row id, because the import recreates the rows.
 * Shared verbatim with the iOS app.
 */
export type SnapshotAnnotationEntity =
  | { t: "ing"; ingredient_index: number; text: string; emoji: string; amount: boolean }
  | { t: "timer"; seconds: number; seconds_max?: number | null; text: string; label: string };

export type SnapshotStepAnnotation = {
  v: 1;
  /** The step text with each entity's mention replaced by `{0}`, `{1}`, …. */
  template: string;
  entities: SnapshotAnnotationEntity[];
};

export type SnapshotInstructionStep = {
  step_text: string;
  group_name: string | null;
  sort_order: number;
  /**
   * The step's cooking-mode annotation (additive key — absent in older
   * snapshots and for steps without a trustworthy one). This app doesn't
   * render chips, but it carries them so an iOS recipient gets them.
   */
  annotation?: SnapshotStepAnnotation | null;
};

export type SharedRecipeSnapshot = {
  name: string;
  description: string | null;
  /** Legacy markdown mirror of the steps — kept for older readers. */
  instructions: string | null;
  /** Structured steps (additive key — absent in old snapshots). */
  instruction_steps?: SnapshotInstructionStep[] | null;
  /** Decodes shares created by older clients; new shares omit this field. */
  category?: number | null;
  base_servings: number | null;
  servings_unit: string | null;
  link: string | null;
  /**
   * The sharer's per-serving values, keyed like the `recipes` columns
   * (additive key — absent in older snapshots and when the recipe had none),
   * so the imported copy shows what was shared instead of a fresh estimate.
   */
  nutrition?: NutritionValues | null;
  /**
   * Whether the shared recipe kept its nutrition updated automatically
   * (additive key — absent reads as automatic), so a hand-managed recipe
   * imports hand-managed.
   */
  nutrition_auto?: boolean | null;
  /** Stable URLs for server-owned copies; legacy rows may contain signed URLs. */
  image_urls: string[];
  /** Storage folder owned by the share and queued for server cleanup on delete. */
  image_folder: string;
  ingredients: SnapshotIngredient[];
};

export type ResolvedRecipeShare = {
  snapshot: SharedRecipeSnapshot;
};

export type SharedRecipeRow = {
  id: string;
  token: string;
  snapshot: SharedRecipeSnapshot;
  created_by: string | null;
  created_at: string;
};
