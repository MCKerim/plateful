import { MealPlanning } from "@/types/exportedDatabaseTypes.types";
import { TFunction } from "i18next";

export function getMealPlanStatus(
  lastMealPlan: MealPlanning | null,
  t: TFunction<"translation", undefined>
): string {
  if (!lastMealPlan) return "-";
  if (lastMealPlan.daysEaten < lastMealPlan.days) return t("common.planned");

  const now = new Date();
  const createdAt = new Date(lastMealPlan.created_at);
  const diffInMilliseconds = now.getTime() - createdAt.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return t("common.today");
  if (diffInDays === 1) return t("common.yesterday");
  return `${diffInDays} ${
    diffInDays === 1 ? t("common.day") : t("common.days")
  }`;
}
