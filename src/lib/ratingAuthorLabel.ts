import type { RecipeRatingWithUser } from "@/components/general/RatingModal";

export function ratingAuthorLabel(rating: RecipeRatingWithUser, formerMemberLabel: string): string {
  const username = rating.users?.username?.trim();
  return username || formerMemberLabel;
}
