import Layout from "@/components/layout/Layout";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

  // --- Weekly Reminder Handlers ---

  async function handleToggleWeeklyReminder(enabled: boolean) {
    if (enabled) {
      const granted = await ensurePermissionGranted();
      if (!granted) return;
    }

    updatePreferences.mutate({
      ...preferences,
      weekly_planning_reminder: {
        ...preferences.weekly_planning_reminder,
        enabled,
      },
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
      weekly_planning_reminder: {
        ...preferences.weekly_planning_reminder,
        time,
      },
    });
  }

  // --- Daily Meal Reminder Handlers ---

  async function handleToggleDailyReminder(enabled: boolean) {
    if (enabled) {
      const granted = await ensurePermissionGranted();
      if (!granted) return;
    }

    updatePreferences.mutate({
      ...preferences,
      daily_meal_reminder: {
        ...preferences.daily_meal_reminder,
        enabled,
      },
    });
  }

  function handleChangeDailyTime(time: string) {
    if (!time) return;
    updatePreferences.mutate({
      ...preferences,
      daily_meal_reminder: {
        ...preferences.daily_meal_reminder,
        time,
      },
    });
  }

  return (
    <Layout>
      <h1 className="second-font text-2xl">{t("notificationSettings.title")}</h1>

      <div className="flex flex-col gap-6">
        {!isNotificationSupported() && (
          <p className="text-sm text-muted-foreground">
            {t("notificationSettings.mobileOnly")}
          </p>
        )}

        {/* Weekly Planning Reminder */}
        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">
            {t("notificationSettings.weeklyReminder.title")}
          </h2>

          <div className="flex items-center justify-between py-1">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium">
                {t("notificationSettings.weeklyReminder.label")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationSettings.weeklyReminder.description")}
              </p>
            </div>
            <Switch
              checked={preferences.weekly_planning_reminder.enabled}
              onCheckedChange={handleToggleWeeklyReminder}
              disabled={!isNotificationSupported()}
            />
          </div>

          {preferences.weekly_planning_reminder.enabled && (
            <div className="flex flex-col gap-3 pt-2 border-t">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
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

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("notificationSettings.weeklyReminder.time")}
                </label>
                <Input
                  type="time"
                  value={preferences.weekly_planning_reminder.time}
                  onChange={(e) => handleChangeWeeklyTime(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Daily Meal Reminder */}
        <div className="flex flex-col gap-2 p-2 border rounded-lg">
          <h2 className="font-medium border-b">
            {t("notificationSettings.dailyMealReminder.title")}
          </h2>

          <div className="flex items-center justify-between py-1">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium">
                {t("notificationSettings.dailyMealReminder.label")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notificationSettings.dailyMealReminder.description")}
              </p>
            </div>
            <Switch
              checked={preferences.daily_meal_reminder.enabled}
              onCheckedChange={handleToggleDailyReminder}
              disabled={!isNotificationSupported()}
            />
          </div>

          {preferences.daily_meal_reminder.enabled && (
            <div className="flex flex-col gap-1 pt-2 border-t">
              <label className="text-sm font-medium">
                {t("notificationSettings.dailyMealReminder.time")}
              </label>
              <Input
                type="time"
                value={preferences.daily_meal_reminder.time}
                onChange={(e) => handleChangeDailyTime(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
