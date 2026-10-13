import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { courseMealType } from "@/lib/mealPlanHelper/mealPlanHelper";
import { MealType } from "@/types/meal-planning.types";

export function usePlannerTracking() {
  const posthog = usePostHog();

  return {
    /** A meal type the user picked, against what the course tags alone suggest (`tags` is empty for a note). */
    trackMealTypeSet: (mealType: MealType, tags: readonly string[]) =>
      posthog?.capture(AnalyticsEvent.plannerMealTypeSet, {
        meal_type: mealType,
        differs_from_default: mealType !== courseMealType(tags),
      }),
  };
}
