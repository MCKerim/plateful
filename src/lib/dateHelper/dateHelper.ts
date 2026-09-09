import i18n from "@/i18n";
import { formatDate } from "date-fns";
import type { Day } from "date-fns";
import { de } from "date-fns/locale";

const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function toWeekday(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let prefix = "";
  let dayAsWord = "";

  if (today.toDateString() === date.toDateString()) {
    dayAsWord = "Today";
  } else if (yesterday.toDateString() === date.toDateString()) {
    dayAsWord = "Yesterday";
  } else if (tomorrow.toDateString() === date.toDateString()) {
    dayAsWord = "Tomorrow";
  } else {
    if (today > date) {
      prefix = "last ";
    }
    dayAsWord = weekday[date.getDay()];
  }
  dayAsWord += " • ";

  const formattedDate = `${String(date.getDate()).padStart(2, "0")}.${String(
    date.getMonth() + 1
  ).padStart(2, "0")}.${date.getFullYear()}`;

  return prefix + dayAsWord + formattedDate;
}

/**
 * The seven days of the week containing `date`, starting on `weekStart`
 * (0 = Sunday .. 6 = Saturday, the server's numbering in `users.week_start`;
 * callers take it from `useWeekStart()`). Every week this app shows or
 * queries goes through here, so the account's week start reaches all of them.
 */
export function getWeekdays(date: Date, weekStart: number): Date[] {
  const weekdays = [];

  // The first day of the week containing the given date.
  const first = new Date(date);
  first.setDate(date.getDate() - ((date.getDay() - weekStartsOn(weekStart) + 7) % 7));

  // Generate exactly 7 days from there.
  for (let i = 0; i < 7; i++) {
    const day = new Date(first);
    day.setDate(first.getDate() + i);
    weekdays.push(day);
  }

  return weekdays;
}

/** `weekStart` as date-fns wants it (`isSameWeek` and friends default to Sunday otherwise). */
export function weekStartsOn(weekStart: number): Day {
  return (((weekStart % 7) + 7) % 7) as Day;
}

/**
 * A calendar day as the server's `planned_date` wants it: a local
 * `yyyy-MM-dd`. Never `toISOString()` here: that is UTC, and between local
 * midnight and 02:00 it names the previous day.
 */
export function toPlannedDateString(date: Date): string {
  return formatDate(date, "yyyy-MM-dd");
}

export const formatDateByLocale = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return formatDate(dateObj, i18n.language === "de" ? "dd.MM.yyyy" : "MM/dd/yyyy", {
    locale: i18n.language === "de" ? de : undefined,
  });
};
