import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectUser } from "@/redux/slices/userSlice";
import { userApi } from "@/api/user.api";
import { NotificationPreferences } from "@/types/notification.types";
import {
  scheduleWeeklyReminder,
  cancelWeeklyReminder,
  scheduleDailyMealReminder,
  cancelDailyMealReminder,
  isNotificationSupported,
} from "@/lib/notifications";

export function useUpdateNotificationPreferences() {
  const { supabase } = useSupabase();
  const user = useAppSelector(selectUser);

  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      if (!user) throw new Error("No user");

      // Update local notifications on native platforms
      if (isNotificationSupported()) {
        if (preferences.weekly_planning_reminder.enabled) {
          await scheduleWeeklyReminder(
            preferences.weekly_planning_reminder.day_of_week,
            preferences.weekly_planning_reminder.time,
            user.language
          );
        } else {
          await cancelWeeklyReminder();
        }

        if (preferences.daily_meal_reminder.enabled) {
          await scheduleDailyMealReminder(
            preferences.daily_meal_reminder.time,
            user.language
          );
        } else {
          await cancelDailyMealReminder();
        }
      }

      // Persist to Supabase
      await userApi.updateNotificationPreferences(supabase, {
        userId: user.id,
        preferences,
      });

      return preferences;
    },
  });
}
