import { RecipeMealPlanInfo } from "@/types/meal-planning.types";
import { TFunction } from "i18next";

export function getMealPlanStatus(
  info: RecipeMealPlanInfo | null,
  t: TFunction<"translation", undefined>
): string {
  if (!info) return "-";

  const { activePlan, lastPlannedDate } = info;

  // If there's an active plan
  if (activePlan) {
    if (activePlan.planned_date === null) {
      // Planned without a specific date
      return t("common.planned");
    }

    // Has a planned date - show relative to today
    return formatFutureDate(activePlan.planned_date, t);
  }

  // No active plan - show when it was last planned
  if (lastPlannedDate) {
    return formatPastDate(lastPlannedDate, t);
  }

  return "-";
}

function formatFutureDate(dateStr: string, t: TFunction<"translation", undefined>): string {
  // Parse the date string as local date (YYYY-MM-DD)
  const [year, month, day] = dateStr.split("-").map(Number);
  const plannedDate = new Date(year, month - 1, day);
  plannedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffInMs = plannedDate.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return t("common.today");
  if (diffInDays === 1) return t("common.tomorrow");
  return t("common.inDays", { count: diffInDays });
}

function formatPastDate(dateStr: string, t: TFunction<"translation", undefined>): string {
  // Parse the date string as local date (YYYY-MM-DD)
  const [year, month, day] = dateStr.split("-").map(Number);
  const pastDate = new Date(year, month - 1, day);
  pastDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffInMs = today.getTime() - pastDate.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return t("common.today");
  if (diffInDays === 1) return t("common.yesterday");

  // Less than a week
  if (diffInDays < 7) {
    return t("common.daysAgo", { count: diffInDays });
  }

  // Less than a month (use weeks)
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return t("common.weeksAgo", { count: weeks });
  }

  // Less than a year (use months)
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return t("common.monthsAgo", { count: months });
  }

  // More than a year
  const years = Math.floor(diffInDays / 365);
  return t("common.yearsAgo", { count: years });
}
