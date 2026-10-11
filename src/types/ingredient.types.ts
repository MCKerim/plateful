import type { Database } from "./database.types";

// Database row type from Supabase
export type RecipeIngredientRow =
  Database["public"]["Tables"]["recipe_ingredients"]["Row"];
export type RecipeIngredientInsert =
  Database["public"]["Tables"]["recipe_ingredients"]["Insert"];
export type RecipeIngredientUpdate =
  Database["public"]["Tables"]["recipe_ingredients"]["Update"];

// Domain type for UI consumption
export type RecipeIngredient = {
  id: string;
  recipeId: string;
  rawText: string;
  quantity: {
    value: number | null; // For calculations
    display: string | null; // For rendering "1/2", "2-3"
  };
  unit: string | null;
  unitNormalized: string | null;
  name: string | null;
  nameNormalized: string | null;
  preparationNote: string | null;
  isOptional: boolean;
  groupName: string | null;
  sortOrder: number;
  isScalable: boolean;
  /** The dictionary slug the enrichment worker gave the line; the shopping list merges and files by it. */
  ingredientSlug: string | null;
};

/**
 * A recipe's rows with the serving count they are written for, read in one
 * query: scaling against `recipes.base_servings` from another cache can use a
 * base that already changed under rescaled rows.
 */
export type IngredientsBundle = {
  baseServings: number | null;
  servingsUnit: string | null;
  ingredients: RecipeIngredient[];
};

// Grouped ingredients for display
export type IngredientGroup = {
  name: string | null; // null = ungrouped
  ingredients: RecipeIngredient[];
};

// Scaled ingredient for display
export type ScaledIngredient = RecipeIngredient & {
  scaledQuantity: {
    value: number | null;
    display: string;
  };
};

// For creating/updating ingredients
export type RecipeIngredientInput = {
  rawText: string;
  groupName?: string | null;
  sortOrder?: number;
  isOptional?: boolean;
};

// Parsing result from ingredient parser
export type ParsedIngredient = {
  quantityValue: number | null;
  quantityDisplay: string | null;
  unit: string | null;
  unitNormalized: string | null;
  ingredientName: string | null;
  ingredientNameNormalized: string | null;
  preparationNote: string | null;
  isScalable: boolean;
};
