export interface WeeklyPlanningReminderPreferences {
  enabled: boolean;
  day_of_week: number; // 0=Sunday ... 6=Saturday
  time: string; // "HH:MM" 24-hour format
}

export interface NotificationPreferences {
  weekly_planning_reminder: WeeklyPlanningReminderPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  weekly_planning_reminder: {
    enabled: true,
    day_of_week: 0, // Sunday
    time: "18:00",
  },
};
