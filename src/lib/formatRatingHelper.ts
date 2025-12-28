export function formatRating(rating: number | null): string {
  if (rating === null || isNaN(rating)) {
    return "-";
  }

  return rating.toFixed(1);
}
