export type GreetingKey =
  | "home.goodMorning"
  | "home.goodAfternoon"
  | "home.goodEvening";

export function getGreetingKey(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return "home.goodMorning";
  if (hour >= 12 && hour < 17) return "home.goodAfternoon";
  return "home.goodEvening";
}
