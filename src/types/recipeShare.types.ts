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

export type SharedRecipeSnapshot = {
  name: string;
  description: string | null;
  instructions: string | null;
  category: number | null;
  base_servings: number | null;
  servings_unit: string | null;
  /** Long-lived signed URLs for the recipe images */
  image_urls: string[];
  ingredients: SnapshotIngredient[];
};

export type SharedRecipeRow = {
  id: string;
  token: string;
  snapshot: SharedRecipeSnapshot;
  created_by: string | null;
  created_at: string;
};
