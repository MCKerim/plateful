import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ratingsApi } from "@/api/ratings.api";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

type DeleteRatingParams = {
  ratingId: number;
  recipeId: number;
};

export function useDeleteRating() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteRatingParams) => {
      return ratingsApi.delete(supabase, params.ratingId);
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ratings.byRecipe(params.recipeId),
      });

      const previousRatings = queryClient.getQueryData<RecipeRatingWithUser[]>(
        queryKeys.ratings.byRecipe(params.recipeId)
      );

      // Optimistic update - remove the rating
      if (previousRatings) {
        queryClient.setQueryData<RecipeRatingWithUser[]>(
          queryKeys.ratings.byRecipe(params.recipeId),
          previousRatings.filter((rating) => rating.id !== params.ratingId)
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
