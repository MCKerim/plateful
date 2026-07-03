import type { Database } from "./database.types";

// Database row types from Supabase
export type RecipeInstructionRow =
  Database["public"]["Tables"]["recipe_instructions"]["Row"];
export type RecipeInstructionInsert =
  Database["public"]["Tables"]["recipe_instructions"]["Insert"];

// Domain type for UI consumption
export type RecipeInstruction = {
  id: string;
  recipeId: string;
  stepText: string;
  groupName: string | null;
  sortOrder: number;
};

// For creating/replacing instruction steps
export type RecipeInstructionInput = {
  stepText: string;
  groupName?: string | null;
  sortOrder?: number;
};
