import { usePostHog } from "posthog-js/react";

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
      posthog?.capture("onboarding_screen_viewed", { screen }),

    trackSurveyAnswered: (params: {
      question_number: number;
      question_key: string;
      selected_options: string[];
    }) => posthog?.capture("survey_question_answered", params),
  };
}
