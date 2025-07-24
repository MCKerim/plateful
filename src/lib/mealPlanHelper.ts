import { MealPlanning } from "@/types/exportedDatabaseTypes.types";

export function getMealPlanStatus(lastMealPlan: MealPlanning | null): string {
  if (!lastMealPlan) return "-";
  if (lastMealPlan.daysEaten < lastMealPlan.days) return "Geplant";

  const now = new Date();
  const createdAt = new Date(lastMealPlan.created_at);
  const diffInMilliseconds = now.getTime() - createdAt.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Heute";
  if (diffInDays === 1) return "Gestern";
  return `${diffInDays} Tage`;
}
