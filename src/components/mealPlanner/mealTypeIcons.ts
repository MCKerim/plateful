import { Cookie, Moon, Sun, Sunrise, type LucideIcon } from "lucide-react";
import { MealType } from "@/types/meal-planning.types";

export const MEAL_TYPE_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};
