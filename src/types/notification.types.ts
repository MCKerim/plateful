export interface WeeklyPlanningReminderPreferences {
  enabled: boolean;
  day_of_week: number; // 0=Sunday ... 6=Saturday
  time: string; // "HH:MM" 24-hour format
}

export interface DailyMealReminderPreferences {
  enabled: boolean;
  time: string; // "HH:MM" 24-hour format
}

export interface NotificationPreferences {
  weekly_planning_reminder: WeeklyPlanningReminderPreferences;
  daily_meal_reminder: DailyMealReminderPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  weekly_planning_reminder: {
    enabled: true,
    day_of_week: 0, // Sunday
    time: "14:00",
  },
  daily_meal_reminder: {
    enabled: true,
    time: "18:00",
  },
};
