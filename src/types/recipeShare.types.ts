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

export type SnapshotInstructionStep = {
  step_text: string;
  group_name: string | null;
  sort_order: number;
};

export type SharedRecipeSnapshot = {
  name: string;
  description: string | null;
  /** Legacy markdown mirror of the steps — kept for older readers. */
  instructions: string | null;
  /** Structured steps (additive key — absent in old snapshots). */
  instruction_steps?: SnapshotInstructionStep[] | null;
  category: number | null;
  base_servings: number | null;
  servings_unit: string | null;
  link: string | null;
  /** Long-lived signed URLs for the snapshot's private image copies */
  image_urls: string[];
  /** Storage folder that owns the image copies (e.g. "shared_<uuid>"), used for cleanup on delete */
  image_folder: string;
  ingredients: SnapshotIngredient[];
};

export type SharedRecipeRow = {
  id: string;
  token: string;
  snapshot: SharedRecipeSnapshot;
  created_by: string | null;
  created_at: string;
};
