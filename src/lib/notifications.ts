import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const WEEKLY_REMINDER_ID = 1001;

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

export async function scheduleWeeklyReminder(
  dayOfWeek: number,
  time: string,
  language: string
): Promise<void> {
  if (!isNotificationSupported()) return;

  // Cancel any existing weekly reminder first
  await cancelWeeklyReminder();

  const [hours, minutes] = time.split(":").map(Number);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: WEEKLY_REMINDER_ID,
        title: getLocalizedTitle(language),
        body: getLocalizedBody(language),
        schedule: {
          on: {
            weekday: dayOfWeek === 0 ? 1 : dayOfWeek + 1, // Capacitor uses 1=Sunday, 2=Monday, etc.
            hour: hours,
            minute: minutes,
          },
          repeats: true,
        },
      },
    ],
  });
}

export async function cancelWeeklyReminder(): Promise<void> {
  if (!isNotificationSupported()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_REMINDER_ID }] });
  } catch {
    // Notification may not exist yet, that's fine
  }
}

function getLocalizedTitle(language: string): string {
  return language === "de" ? "Wochenplanung" : "Weekly Planning";
}

function getLocalizedBody(language: string): string {
  return language === "de"
    ? "Zeit, deine Mahlzeiten für die Woche zu planen! 🍽️"
    : "Time to plan your meals for the week! 🍽️";
}
