import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const WEEKLY_REMINDER_ID = 1001;
const DAILY_MEAL_REMINDER_ID = 1002;

export type NotificationType = "weekly_planning_reminder" | "daily_meal_reminder";

export function isNotificationSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("LocalNotifications");
}

export async function checkNotificationPermission(): Promise<"granted" | "denied" | "prompt"> {
  if (!isNotificationSupported()) return "denied";

  const result = await LocalNotifications.checkPermissions();
  if (result.display === "granted") return "granted";
  if (result.display === "denied") return "denied";
  return "prompt";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

// --- Weekly Planning Reminder ---

export async function scheduleWeeklyReminder(
  dayOfWeek: number,
  time: string,
  language: string
): Promise<void> {
  if (!isNotificationSupported()) return;

  await cancelWeeklyReminder();

  const [hours, minutes] = time.split(":").map(Number);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: WEEKLY_REMINDER_ID,
        title: getWeeklyReminderTitle(language),
        body: getWeeklyReminderBody(language),
        schedule: {
          on: {
            weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1, // Capacitor uses 1=Sunday, 2=Monday, etc.
            hour: hours,
            minute: minutes,
          },
          repeats: true,
        },
        extra: { type: "weekly_planning_reminder" satisfies NotificationType },
      },
    ],
  });
}

export async function cancelWeeklyReminder(): Promise<void> {
  if (!isNotificationSupported()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REMINDER_ID }] });
  } catch {
    // Notification may not exist yet
  }
}

function getWeeklyReminderTitle(language: string): string {
  return language === "de" ? "Wochenplanung" : "Weekly Planning";
}

function getWeeklyReminderBody(language: string): string {
  return language === "de"
    ? "Zeit, deine Mahlzeiten für die Woche zu planen! 🍽️"
    : "Time to plan your meals for the week! 🍽️";
}

// --- Daily Meal Reminder ---

export async function scheduleDailyMealReminder(
  time: string,
  language: string
): Promise<void> {
  if (!isNotificationSupported()) return;

  await cancelDailyMealReminder();

  const [hours, minutes] = time.split(":").map(Number);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_MEAL_REMINDER_ID,
        title: getDailyReminderTitle(language),
        body: getDailyReminderBody(language),
        schedule: {
          on: {
            hour: hours,
            minute: minutes,
          },
          repeats: true,
        },
        extra: { type: "daily_meal_reminder" satisfies NotificationType },
      },
    ],
  });
}

export async function cancelDailyMealReminder(): Promise<void> {
  if (!isNotificationSupported()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_MEAL_REMINDER_ID }] });
  } catch {
    // Notification may not exist yet
  }
}

function getDailyReminderTitle(language: string): string {
  return language === "de" ? "Was gibt's heute?" : "What's cooking today?";
}

function getDailyReminderBody(language: string): string {
  return language === "de"
    ? "Schau dir deinen Essensplan für heute an! 🍽️"
    : "Check out your meal plan for today! 🍽️";
}
