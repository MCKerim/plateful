/**
 * The planner's first weekday, in the server's numbering (`users.week_start`,
 * 0 = Sunday .. 6 = Saturday, like `day_of_week` in the plan reminders).
 *
 * The account owns the value: the first client that sees an account without
 * one seeds it from the device (`seed_week_start`), after that only the
 * Settings picker changes it, and later changes of the device's own setting
 * are ignored on purpose, so the server (the weekly reminder, and the
 * week-planning features to come) never has to guess a user's week. Contract
 * and the iOS side: docs/knowledge/week-start.md in
 * ~/programming/ios-native/plateful.
 */

/**
 * Monday: the only week this app knew before the setting, and what the server
 * counts for a row no client has seeded yet.
 */
export const DEFAULT_WEEK_START = 1;

/**
 * The device's first weekday from the browser locale's week info, or Monday
 * where the browser cannot say (Firefox, older Android WebViews, a locale tag
 * that does not parse). What the seed writes for an account without one.
 */
export function deviceWeekStart(
  locale: string | undefined = typeof navigator === "undefined" ? undefined : navigator.language
): number {
  if (!locale) return DEFAULT_WEEK_START;
  try {
    const info = weekInfo(new Intl.Locale(locale));
    if (info && Number.isInteger(info.firstDay)) {
      return intlFirstDayToWeekStart(info.firstDay);
    }
  } catch {
    // An unparseable locale tag; Monday it is.
  }
  return DEFAULT_WEEK_START;
}

/** `Intl` counts 1 = Monday .. 7 = Sunday, the server 0 = Sunday .. 6 = Saturday. */
export function intlFirstDayToWeekStart(firstDay: number): number {
  return firstDay % 7;
}

/**
 * The seven weekday indices in the order a week starting on `weekStart` reads
 * them: the week-start picker lists them in the device's order, the reminder's
 * day picker in the planner's.
 */
export function weekdayOrder(weekStart: number): number[] {
  const start = ((weekStart % 7) + 7) % 7;
  return Array.from({ length: 7 }, (_, index) => (start + index) % 7);
}

/** The weekday labels under `notificationSettings.days`, indexed by the server's numbering. */
export const WEEKDAY_TRANSLATION_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type WeekInfo = { firstDay: number };

// `getWeekInfo()` is the standardized form, `weekInfo` the accessor older
// engines shipped; neither is in the ES2020 lib typings this target uses.
function weekInfo(locale: Intl.Locale): WeekInfo | undefined {
  const candidate = locale as Intl.Locale & {
    getWeekInfo?: () => WeekInfo;
    weekInfo?: WeekInfo;
  };
  return candidate.getWeekInfo?.() ?? candidate.weekInfo;
}
