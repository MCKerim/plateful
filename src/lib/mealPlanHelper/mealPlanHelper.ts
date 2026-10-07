import {
  MealPlannerItem,
  PlanSubject,
  RecipeMealPlanInfo,
  RecipePlacementRow,
} from "@/types/meal-planning.types";
import { TFunction } from "i18next";

/** A stable key for a plan subject, for query keys and effect dependencies. */
export function planSubjectKey(subject: PlanSubject): string {
  return subject.kind === "recipe" ? `recipe:${subject.id}` : `note:${subject.noteId}`;
}

/** What the weekly plan dialog edits when opened from a planned entry. */
export function planSubjectOf(item: MealPlannerItem): PlanSubject {
  return item.kind === "recipe"
    ? { kind: "recipe", id: item.recipeId, name: item.recipeName }
    : { kind: "note", noteId: item.noteId, text: item.text };
}

/**
 * Which chips the note dialog shows: the household's own texts first (the
 * server's order, most planned first), then the built-in suggestions that
 * aren't already among them, six at most. Duplicates match without case and
 * surrounding whitespace, the way the server groups them. The same rule as
 * the native app's `PlannerNoteSuggestionChips.merge`.
 */
export function mergeNoteSuggestions(own: string[], defaults: string[], limit = 6): string[] {
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const candidate of [...own, ...defaults]) {
    const trimmed = candidate.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    chips.push(trimmed);
    if (chips.length === limit) break;
  }
  return chips;
}

/**
 * A day's (or the pool's) order on screen: recipes first, then notes, each
 * group in the plan's own order. The native app lists a day the same way.
 */
export function orderForDisplay<T extends MealPlannerItem>(items: T[]): T[] {
  return [
    ...items.filter((item) => item.kind === "recipe"),
    ...items.filter((item) => item.kind === "note"),
  ];
}

/**
 * The most recent day each recipe was on the plan, keyed by recipe id, as a
 * `yyyy-MM-dd` string: the key behind the cookbook's "not planned in a while"
 * sort. A dated placement counts as its day (ahead or behind), an uncooked
 * pool copy counts as today, and a pool copy already checked off has no day
 * and is skipped, the same reading `getMealPlanStatus` gives the cards.
 * Recipes never on the plan are absent. Mirrors the native app's
 * `PlannedMeal.lastPlannedDates`.
 */
export function lastPlannedDates(
  rows: RecipePlacementRow[],
  todayStr: string
): Record<string, string> {
  const dates: Record<string, string> = {};
  for (const row of rows) {
    let day: string;
    if (row.planned_date !== null) day = row.planned_date;
    else if (!row.eaten) day = todayStr;
    else continue;
    const known = dates[row.recipe_id];
    if (known === undefined || known < day) dates[row.recipe_id] = day;
  }
  return dates;
}

/**
 * One recipe's plan status from its placements, the reading `getMealPlanStatus`
 * shows: the earliest placement from today on is the active plan; without one,
 * an uncooked pool copy is ("planned", no day); otherwise the most recent past
 * day is remembered. Pool copies already checked off count for nothing. The
 * same rule the recipe page gets from `mealPlanningApi.getInfoByRecipe`.
 */
export function recipeMealPlanInfo(
  rows: RecipePlacementRow[],
  todayStr: string
): RecipeMealPlanInfo {
  let nextDay: string | null = null;
  let lastDay: string | null = null;
  let openInPool = false;
  for (const row of rows) {
    if (row.planned_date === null) {
      if (!row.eaten) openInPool = true;
    } else if (row.planned_date >= todayStr) {
      if (nextDay === null || row.planned_date < nextDay) nextDay = row.planned_date;
    } else if (lastDay === null || row.planned_date > lastDay) {
      lastDay = row.planned_date;
    }
  }
  const activePlan =
    nextDay !== null ? { planned_date: nextDay } : openInPool ? { planned_date: null } : null;
  return { activePlan, lastPlannedDate: lastDay };
}

/**
 * `recipeMealPlanInfo` for every recipe in the household's plan history at
 * once, keyed by recipe id: one request for all cookbook cards instead of one
 * per card (454 of them once exhausted the database's connection slots,
 * docs/knowledge/supabase-connection-limit.md). Rows without a recipe (notes)
 * are skipped; recipes never on the plan are absent.
 */
export function recipeMealPlanInfos(
  rows: RecipePlacementRow[],
  todayStr: string
): Record<string, RecipeMealPlanInfo> {
  const byRecipe = new Map<string, RecipePlacementRow[]>();
  for (const row of rows) {
    if (!row.recipe_id) continue;
    const list = byRecipe.get(row.recipe_id);
    if (list) list.push(row);
    else byRecipe.set(row.recipe_id, [row]);
  }
  const infos: Record<string, RecipeMealPlanInfo> = {};
  for (const [recipeId, recipeRows] of byRecipe) {
    infos[recipeId] = recipeMealPlanInfo(recipeRows, todayStr);
  }
  return infos;
}

/**
 * Sort key for "not planned in a while": the last day on the plan, else the
 * day the recipe was added, so yesterday's import doesn't top the list just
 * because nobody has planned it yet. `created_at` is an ISO timestamp; its
 * first ten characters are the day, comparable with the plan's dates.
 */
export function leastRecentlyPlannedKey(
  recipe: { id: string; created_at: string },
  lastPlanned: Record<string, string>
): string {
  return lastPlanned[recipe.id] ?? recipe.created_at.slice(0, 10);
}

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
