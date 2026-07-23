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
  /** Decodes shares created by older clients; new shares omit this field. */
  category?: number | null;
  base_servings: number | null;
  servings_unit: string | null;
  link: string | null;
  /** Stable URLs for server-owned copies; legacy rows may contain signed URLs. */
  image_urls: string[];
  /** Storage folder owned by the share and queued for server cleanup on delete. */
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
