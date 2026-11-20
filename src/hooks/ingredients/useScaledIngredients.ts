import { useMemo } from "react";
import { useRecipeIngredients } from "./useRecipeIngredients";
import { scaleIngredients } from "@/lib/ingredient-parser/scale-ingredients";
import { contentLanguage } from "@/lib/contentLanguage";
import type { ScaledIngredient } from "@/types/ingredient.types";

export function useScaledIngredients(
  recipeId: string | null,
  baseServings: number,
  targetServings: number
): {
  data: ScaledIngredient[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: ingredients = [], isLoading, error } = useRecipeIngredients(recipeId);

  // Scaled amounts take the reader's decimal separator ("583,33 g" in German).
  const locale = contentLanguage();
  const scaledIngredients = useMemo(() => {
    if (ingredients.length === 0) return [];
    return scaleIngredients(ingredients, baseServings, targetServings, locale);
  }, [ingredients, baseServings, targetServings, locale]);

  return {
    data: scaledIngredients,
    isLoading,
    error: error as Error | null,
  };
}
