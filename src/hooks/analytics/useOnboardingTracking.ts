import { usePostHog } from "posthog-js/react";
import { AnalyticsEvent } from "@/lib/analyticsEvents";

/**
 * The `screen` of `onboarding_screen_viewed`. A cross-platform contract: the
 * native iOS app sends the same keys for the same steps
 * (`Analytics.OnboardingScreen` in `plateful/Core/Analytics.swift`), so one
 * funnel spans both apps. Keys are immutable once sent — PostHog can't
 * rename history.
 */
export type OnboardingScreen =
  | "welcome"
  | "signup"
  | "signup_email"
  | "signup_verify"
  | "login"
  | "value_emotional_hook"
  | "value_meal_planning"
  | "value_chatbot"
  | "value_import_recipes"
  // iOS sends further keys for screens only it has (value_make_it_yours,
  // value_cooking_mode, value_household, all_set); they are deliberately not
  // in this union — a web screen must never reuse one. The full table lives
  // in docs/analytics.md of the iOS repo.
  | "survey_start"
  | "survey_1"
  | "survey_2"
  | "survey_3"
  | "survey_4"
  | "survey_5"
  | "survey_6"
  | "survey_7"
  | "survey_8"
  | "survey_9"
  | "how_it_works"
  | "social_proof"
  | "trial_offer"
  | "trial_reminder"
  | "subscribe"
  | "choose_username"
  | "create_household"
  | "invite_members";

export function useOnboardingTracking() {
  const posthog = usePostHog();

  return {
    trackScreenViewed: (screen: OnboardingScreen) =>
      posthog?.capture(AnalyticsEvent.onboardingScreenViewed, { screen }),

    trackSurveyAnswered: (params: {
      question_number: number;
      question_key: string;
      selected_options: string[];
    }) => posthog?.capture(AnalyticsEvent.surveyQuestionAnswered, params),
  };
}
