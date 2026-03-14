import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

export default function NotificationSettings() {
  const { t } = useTranslation();
  const user = useAppSelector(selectUser);
  const updatePreferences = useUpdateNotificationPreferences();
  const { permissionState, requestPermission, checkPermission } = useNotificationPermission();

  useEffect(() => {
    if (isNotificationSupported()) {
      checkPermission();
    }
  }, [checkPermission]);

  const preferences: NotificationPreferences =
    (user?.notification_preferences as unknown as NotificationPreferences) ??
    DEFAULT_NOTIFICATION_PREFERENCES;

  const switchesDisabled = !isNotificationSupported() || permissionState !== "granted";

  function handleToggleWeeklyReminder(enabled: boolean) {
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

  function handleToggleDailyReminder(enabled: boolean) {
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

        {isNotificationSupported() && permissionState === "prompt" && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t("notificationSettings.permissionRequired")}
            </p>
            <Button size="sm" onClick={requestPermission}>
              {t("notificationSettings.grantPermission")}
            </Button>
          </div>
        )}

        {isNotificationSupported() && permissionState === "denied" && (
          <p className="text-sm text-muted-foreground p-4 border rounded-lg">
            {t("notificationSettings.permissionDenied")}
          </p>
        )}

        {/* Weekly Planning Reminder */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-medium">{t("notificationSettings.weeklyReminder.title")}</h2>
            <Switch
              checked={preferences.weekly_planning_reminder.enabled}
              onCheckedChange={handleToggleWeeklyReminder}
              disabled={switchesDisabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("notificationSettings.weeklyReminder.description")}
          </p>

          {preferences.weekly_planning_reminder.enabled && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
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
              disabled={switchesDisabled}
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
