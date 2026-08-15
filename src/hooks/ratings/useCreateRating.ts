import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { ratingsApi, CreateRatingParams } from "@/api/ratings.api";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

export function useCreateRating() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (params: CreateRatingParams) => {
      return ratingsApi.create(supabase, params);
    },
    onSuccess: (_data, params) => {
      posthog?.capture(AnalyticsEvent.recipeRated, { rating: params.stars, is_edit: false });
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ratings.byRecipe(params.recipeId),
      });

      const previousRatings = queryClient.getQueryData<RecipeRatingWithUser[]>(
        queryKeys.ratings.byRecipe(params.recipeId)
      );

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
