import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { recipeApi } from "@/api/recipe.api";
import { ingredientsApi } from "@/api/ingredients.api";
import { formatQuantity, reconstructIngredientText } from "@/lib/ingredient-parser/format-quantity";
import type { Recipes } from "@/types/exportedDatabaseTypes.types";
import type { RecipeIngredient } from "@/types/ingredient.types";

export function useUpdateBaseServings() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      baseServings,
      previousBaseServings,
    }: {
      recipeId: string;
      baseServings: number;
      previousBaseServings: number;
    }) => {
      const scaleFactor = baseServings / previousBaseServings;

      await Promise.all([
        recipeApi.updateBaseServings(supabase, recipeId, baseServings),
        ingredientsApi.scaleQuantities(supabase, recipeId, scaleFactor),
      ]);
    },
    onMutate: async (variables) => {
      const { recipeId, baseServings, previousBaseServings } = variables;
      const scaleFactor = baseServings / previousBaseServings;

      // Cancel in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
      await queryClient.cancelQueries({
        queryKey: queryKeys.recipes.ingredients(recipeId),
      });

      // Snapshot current cache for rollback
      const previousRecipe = queryClient.getQueryData<Recipes>(
        queryKeys.recipes.detail(recipeId)
      );
      const previousIngredients = queryClient.getQueryData<RecipeIngredient[]>(
        queryKeys.recipes.ingredients(recipeId)
      );

      // Optimistically update recipe base_servings
      if (previousRecipe) {
        queryClient.setQueryData<Recipes>(
          queryKeys.recipes.detail(recipeId),
          { ...previousRecipe, base_servings: baseServings }
        );
      }

      // Optimistically update ingredient quantities
      if (previousIngredients) {
        queryClient.setQueryData<RecipeIngredient[]>(
          queryKeys.recipes.ingredients(recipeId),
          previousIngredients.map((ing) => {
            if (!ing.isScalable || ing.quantity.value === null) return ing;
            const scaledValue = ing.quantity.value * scaleFactor;
            const scaledDisplay = formatQuantity(scaledValue);
            return {
              ...ing,
              rawText: reconstructIngredientText(
                scaledDisplay,
                ing.unit,
                ing.name,
                ing.preparationNote
              ),
              quantity: {
                value: scaledValue,
                display: scaledDisplay,
              },
            };
          })
        );
      }

      return { previousRecipe, previousIngredients };
    },
    onError: (_error, variables, context) => {
      // Rollback on failure
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          queryKeys.recipes.detail(variables.recipeId),
          context.previousRecipe
        );
      }
      if (context?.previousIngredients) {
        queryClient.setQueryData(
          queryKeys.recipes.ingredients(variables.recipeId),
          context.previousIngredients
        );
      }
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.detail(variables.recipeId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.ingredients(variables.recipeId),
        }),
      ]);
    },
  });
}
