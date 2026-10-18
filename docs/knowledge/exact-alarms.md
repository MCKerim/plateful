# Exact alarms: `SCHEDULE_EXACT_ALARM` only, never `USE_EXACT_ALARM`

**Stand 2026-10-19.** The cooking timers (`src/lib/cooking/timerAlarms.ts`) schedule one local notification per running timer with `allowWhileIdle: true`. `@capacitor/local-notifications` 8.0.1 (`LocalNotificationManager.setExactIfPossible`) uses `setExactAndAllowWhileIdle` when `AlarmManager.canScheduleExactAlarms()` is true and otherwise falls back to the inexact `setAndAllowWhileIdle`, with a log warning and no error.

versionCode 44 (1.5) declared `USE_EXACT_ALARM` as well, on the reasoning that Android grants it to timer apps without a prompt. Play refused production: it reserves `USE_EXACT_ALARM` for apps whose core function is an alarm clock or a calendar, asks in a declaration form which of the two the app is, and requires the permission to be removed from every track otherwise. Plateful is neither; do not answer "Wecker" or "Kalender". versionCode 45 dropped the permission.

What remains is `SCHEDULE_EXACT_ALARM`, a user-granted permission without a Play declaration:

- Android 12 and 13: granted at install, timers are exact through Doze.
- Android 14 and later: denied by default for new installs. Timers fall back to inexact alarms, which can arrive late while the app is in the background and the phone is idle. The in-app ring on the open cooking screen is unaffected (`useWakeLock` keeps the screen on).

The plugin already has `checkExactNotificationSetting()` and `changeExactNotificationSetting()` (opens the system's "Alarms & reminders" page for the app) to let a cook opt in on Android 14+; Plateful does not call them yet.
