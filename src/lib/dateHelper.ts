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

  if (today.toDateString() === date.toDateString()) {
    return "Today";
  } else {
    let prefix = "next";
    if (today > date) {
      prefix = "last";
    }
    return `${prefix} ${weekday[date.getDay()]}`;
  }
}
