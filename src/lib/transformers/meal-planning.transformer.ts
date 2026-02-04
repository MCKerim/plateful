import { MealPlannerItem, MealPlannerItemRaw } from "@/types/meal-planning.types";

export function transformMealPlannerItems(raw: MealPlannerItemRaw[]): MealPlannerItem[] {
  return raw.map((item) => ({
    id: item.id,
    recipeId: item.recipes?.id ?? "",
    recipeName: item.recipes?.name ?? "-",
    planned_date: item.planned_date ? new Date(item.planned_date) : null,
    eaten: item.eaten,
  }));
}
