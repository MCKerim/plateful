import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { recipeShareApi } from "@/api/recipeShare.api";
import { recipeApi } from "@/api/recipe.api";
import { ingredientsApi } from "@/api/ingredients.api";
import { Share } from "@capacitor/share";
import type { SnapshotIngredient } from "@/types/recipeShare.types";

const SHARE_BASE_URL = "https://app.plateful.cloud/share";

export function useCreateRecipeShare() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (recipeId: string): Promise<string> => {
      // 1. Fetch recipe details
      const recipe = await recipeApi.getById(supabase, recipeId);
      if (!recipe) throw new Error("Recipe not found");

      // 2. Fetch ingredients
      const ingredientRows = await ingredientsApi.getByRecipeId(supabase, recipeId);
      const ingredients: SnapshotIngredient[] = ingredientRows.map((row) => ({
        raw_text: row.raw_text,
        quantity_value: row.quantity_value,
        quantity_display: row.quantity_display,
        unit: row.unit,
        ingredient_name: row.ingredient_name,
        group_name: row.group_name,
        sort_order: row.sort_order,
        is_scalable: row.is_scalable,
        is_optional: row.is_optional,
        preparation_note: row.preparation_note,
      }));

      // 3. Get image paths for long-lived signing
      const imagePaths = await recipeShareApi.getImagePaths(supabase, recipeId);

      // 4. Create the share record (signs images server-side with ~10y TTL)
      const token = await recipeShareApi.create(supabase, recipeId, {
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        category: recipe.category,
        base_servings: recipe.base_servings,
        servings_unit: recipe.servings_unit,
        image_paths: imagePaths,
        ingredients,
      });

      return token;
    },

    onSuccess: async (token, recipeId) => {
      const shareUrl = `${SHARE_BASE_URL}/${token}`;

      try {
        await Share.share({
          url: shareUrl,
          dialogTitle: "Share Recipe",
        });
      } catch {
        // Share dialog dismissed or not available — URL is still usable
      }
    },
  });
}
