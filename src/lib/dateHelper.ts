import i18n from "@/i18n";
import { formatDate } from "date-fns";
import { de } from "date-fns/locale";

const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

export const formatDateByLocale = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDate(
    dateObj,
    i18n.language === "de" ? "dd.MM.yyyy" : "MM/dd/yyyy",
    { locale: i18n.language === "de" ? de : undefined }
  );
};
