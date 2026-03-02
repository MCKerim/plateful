import Layout from "@/components/layout/Layout";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeInput } from "@/components/ui/time-input";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { useUpdateNotificationPreferences } from "@/hooks/notifications/useUpdateNotificationPreferences";
import { useNotificationPermission } from "@/hooks/notifications/useNotificationPermission";
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/types/notification.types";
import { isNotificationSupported } from "@/lib/notifications";
import { toast } from "sonner";

export default function NotificationSettings() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const updatePreferences = useUpdateNotificationPreferences();
  const { requestPermission, checkPermission } = useNotificationPermission();

  const preferences: NotificationPreferences =
    (user?.notification_preferences as unknown as NotificationPreferences) ??
    DEFAULT_NOTIFICATION_PREFERENCES;

  async function ensurePermissionGranted(): Promise<boolean> {
    const status = await checkPermission();
    if (status === "granted") return true;

    const granted = await requestPermission();
    if (!granted) {
      toast.error(t("notificationSettings.permissionDenied"));
    }
    return granted;
  }

  async function handleToggleWeeklyReminder(enabled: boolean) {
    if (enabled) {
      const granted = await ensurePermissionGranted();
      if (!granted) return;
    }
    updatePreferences.mutate({
      ...preferences,
      weekly_planning_reminder: { ...preferences.weekly_planning_reminder, enabled },
    });
  }

  function handleChangeDayOfWeek(day: string) {
    updatePreferences.mutate({
      ...preferences,
      weekly_planning_reminder: {
        ...preferences.weekly_planning_reminder,
        day_of_week: parseInt(day),
      },
    });
  }

  function handleChangeWeeklyTime(time: string) {
    if (!time) return;
    updatePreferences.mutate({
      ...preferences,
      weekly_planning_reminder: { ...preferences.weekly_planning_reminder, time },
    });
  }

  async function handleToggleDailyReminder(enabled: boolean) {
    if (enabled) {
      const granted = await ensurePermissionGranted();
      if (!granted) return;
    }
    updatePreferences.mutate({
      ...preferences,
      daily_meal_reminder: { ...preferences.daily_meal_reminder, enabled },
    });
  }

  function handleChangeDailyTime(time: string) {
    if (!time) return;
    updatePreferences.mutate({
      ...preferences,
      daily_meal_reminder: { ...preferences.daily_meal_reminder, time },
    });
  }

  return (
    <Layout>
      <h1 className="second-font text-2xl">{t("notificationSettings.title")}</h1>

      <div className="flex flex-col gap-4">
        {!isNotificationSupported() && (
          <p className="text-sm text-muted-foreground">{t("notificationSettings.mobileOnly")}</p>
        )}

        {/* Weekly Planning Reminder */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-medium">{t("notificationSettings.weeklyReminder.title")}</h2>
            <Switch
              checked={preferences.weekly_planning_reminder.enabled}
              onCheckedChange={handleToggleWeeklyReminder}
              disabled={!isNotificationSupported()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("notificationSettings.weeklyReminder.description")}
          </p>

          {preferences.weekly_planning_reminder.enabled && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">
                  {t("notificationSettings.weeklyReminder.dayOfWeek")}
                </label>
                <Select
                  value={preferences.weekly_planning_reminder.day_of_week.toString()}
                  onValueChange={handleChangeDayOfWeek}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("notificationSettings.days.sunday")}</SelectItem>
                    <SelectItem value="1">{t("notificationSettings.days.monday")}</SelectItem>
                    <SelectItem value="2">{t("notificationSettings.days.tuesday")}</SelectItem>
                    <SelectItem value="3">{t("notificationSettings.days.wednesday")}</SelectItem>
                    <SelectItem value="4">{t("notificationSettings.days.thursday")}</SelectItem>
                    <SelectItem value="5">{t("notificationSettings.days.friday")}</SelectItem>
                    <SelectItem value="6">{t("notificationSettings.days.saturday")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TimeInput
                value={preferences.weekly_planning_reminder.time}
                onChange={handleChangeWeeklyTime}
              />
            </div>
          )}
        </div>

        {/* Daily Meal Reminder */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-medium">{t("notificationSettings.dailyMealReminder.title")}</h2>
            <Switch
              checked={preferences.daily_meal_reminder.enabled}
              onCheckedChange={handleToggleDailyReminder}
              disabled={!isNotificationSupported()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("notificationSettings.dailyMealReminder.description")}
          </p>

          {preferences.daily_meal_reminder.enabled && (
            <TimeInput
              value={preferences.daily_meal_reminder.time}
              onChange={handleChangeDailyTime}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
