import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { courseMealType } from "@/lib/mealPlanHelper/mealPlanHelper";
import { MealType } from "@/types/meal-planning.types";

export function usePlannerTracking() {
  const posthog = usePostHog();

  return {
    /** A meal type the user picked for a recipe, against what its course tags alone suggest. */
    trackMealTypeSet: (mealType: MealType, tags: readonly string[]) =>
      posthog?.capture(AnalyticsEvent.plannerMealTypeSet, {
        meal_type: mealType,
        differs_from_default: mealType !== courseMealType(tags),
      }),
  };
}
