import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ratingsApi, UpdateRatingParams } from "@/api/ratings.api";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

type UpdateRatingWithRecipeId = UpdateRatingParams & { recipeId: number };

export function useUpdateRating() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateRatingWithRecipeId) => {
      return ratingsApi.update(supabase, params);
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ratings.byRecipe(params.recipeId),
      });

      const previousRatings = queryClient.getQueryData<RecipeRatingWithUser[]>(
        queryKeys.ratings.byRecipe(params.recipeId)
      );

      // Optimistic update
      if (previousRatings) {
        queryClient.setQueryData<RecipeRatingWithUser[]>(
          queryKeys.ratings.byRecipe(params.recipeId),
          previousRatings.map((rating) =>
            rating.id === params.ratingId
              ? { ...rating, stars: params.stars, note: params.note }
              : rating
          )
        );
      }

      return { previousRatings, recipeId: params.recipeId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRatings && context?.recipeId) {
        queryClient.setQueryData(
          queryKeys.ratings.byRecipe(context.recipeId),
          context.previousRatings
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.byRecipe(variables.recipeId),
      });
    },
  });
}
