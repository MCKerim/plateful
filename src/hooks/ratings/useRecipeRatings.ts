import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { queryKeys } from "@/lib/query-keys";
import { ratingsApi } from "@/api/ratings.api";
import { RecipeRatingWithUser } from "@/components/general/RatingModal";

function calculateAverage(ratings: RecipeRatingWithUser[]): number | null {
  if (ratings.length === 0) return null;
  const totalStars = ratings.reduce((acc, rating) => acc + rating.stars, 0);
  return totalStars / ratings.length;
}

export function useRecipeRatings(recipeId: number | null) {
  const { supabase } = useSupabase();

  const query = useQuery({
    queryKey: queryKeys.ratings.byRecipe(recipeId ?? 0),
    queryFn: async () => {
      if (!recipeId) return [];
      return ratingsApi.getByRecipe(supabase, recipeId);
    },
    enabled: !!recipeId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    ratings: query.data ?? [],
    averageRating: calculateAverage(query.data ?? []),
  };
}
