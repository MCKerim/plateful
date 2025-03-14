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
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (today.toDateString() === date.toDateString()) {
    return "Today";
  } else if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  } else if (dayBeforeYesterday.toDateString() === date.toDateString()) {
    return "the day before yesterday";
  } else if (tomorrow.toDateString() === date.toDateString()) {
    return "Tomorrow";
  } else {
    let prefix = "";
    if (today > date) {
      prefix = "last ";
    }
    return prefix + weekday[date.getDay()];
  }
}