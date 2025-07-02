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

  const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  return prefix + dayAsWord + formattedDate;
}

// Returns an array of 1 week from Monday to Sunday (7 days total) for the week containing the given date
export function getWeekdays(date: Date = new Date()): Date[] {
  const weekdays = [];
  const dayOfWeek = date.getDay();

  // Calculate Monday of the week containing the given date
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));

  // Generate exactly 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekdays.push(day);
  }

  return weekdays;
}
