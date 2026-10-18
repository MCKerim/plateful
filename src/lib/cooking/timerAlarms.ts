import { LocalNotifications } from "@capacitor/local-notifications";
import {
  checkNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/notifications";
import type { CookingTimer } from "@/lib/cooking/timer";
import { reportError } from "@/utils/reportError";

/**
 * A stable 31-bit id for a timer's notification (the plugin wants integers):
 * FNV-1a over the uuid, so a reschedule replaces the pending alarm and a
 * stop finds it.
 */
export function alarmId(timerId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < timerId.length; i += 1) {
    hash ^= timerId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash & 0x7fffffff;
}

/** Asked once, when the first timer starts: an alarm without permission rings nowhere. */
export async function ensureTimerAlarmPermission(): Promise<void> {
  if (!isNotificationSupported()) return;
  try {
    if ((await checkNotificationPermission()) === "prompt") await requestNotificationPermission();
  } catch (error) {
    reportError("Timer alarm permission request failed", error);
  }
}

type AlarmText = { recipeId: string; recipeName: string; title: string };

/**
 * Per-device alarms for the timers, the iOS `CookingTimerNotifications`:
 * every running timer gets one notification at its end (exact through Doze
 * where Android allows it, see docs/knowledge/exact-alarms.md), a fired one loses its pending alarm but keeps its delivered banner
 * until the cook dismisses it. Call on every timer change; scheduling with
 * the same id replaces, so reconciling never accumulates. Fires quietly
 * without permission, and does nothing on the web.
 */
export async function reconcileTimerAlarms(
  timers: readonly CookingTimer[],
  text: AlarmText,
  now = Date.now()
): Promise<void> {
  if (!isNotificationSupported()) return;
  try {
    const running = timers.filter((timer) => timer.endsAt !== null && timer.endsAt > now);
    const fired = timers.filter((timer) => timer.endsAt !== null && timer.endsAt <= now);
    if (fired.length > 0) {
      await LocalNotifications.cancel({ notifications: fired.map((timer) => ({ id: alarmId(timer.id) })) });
    }
    if (running.length > 0) {
      await LocalNotifications.schedule({
        notifications: running.map((timer) => ({
          id: alarmId(timer.id),
          title: text.title,
          body: `${timer.label} · ${text.recipeName}`,
          schedule: { at: new Date(timer.endsAt ?? now), allowWhileIdle: true },
          extra: { type: "cooking_timer", timer_id: timer.id, recipe_id: text.recipeId },
        })),
      });
    }
  } catch (error) {
    reportError("Timer alarm reconcile failed", error);
  }
}

/** Clears a timer's alarm, pending and delivered: an explicit stop or dismiss. */
export async function cancelTimerAlarms(timerIds: readonly string[]): Promise<void> {
  if (!isNotificationSupported() || timerIds.length === 0) return;
  const notifications = timerIds.map((id) => ({ id: alarmId(id) }));
  try {
    await LocalNotifications.cancel({ notifications });
    await LocalNotifications.removeDeliveredNotifications({ notifications: notifications as never });
  } catch (error) {
    reportError("Timer alarm cancel failed", error);
  }
}
