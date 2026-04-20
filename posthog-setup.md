# PostHog Setup Guide

## Events Tracked

| Event                      | Properties                                              | Where fired                        |
| -------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `onboarding_screen_viewed` | `screen: OnboardingScreen`                              | Every onboarding screen on mount   |
| `survey_question_answered` | `question_number`, `question_key`, `selected_options[]` | Survey.tsx after successful upsert |

---

## 1. Onboarding Funnel

**Where:** Insights → New Insight → Funnel

**Steps (in order):**

1. `onboarding_screen_viewed` where `screen = welcome`
2. `onboarding_screen_viewed` where `screen = signup`
3. `onboarding_screen_viewed` where `screen = value_emotional_hook`
4. `onboarding_screen_viewed` where `screen = survey_start`
5. `onboarding_screen_viewed` where `screen = social_proof`
6. `onboarding_screen_viewed` where `screen = trial_offer`
7. `onboarding_screen_viewed` where `screen = trial_reminder`
8. `onboarding_screen_viewed` where `screen = subscribe`
9. `onboarding_screen_viewed` where `screen = choose_username`
10. `onboarding_screen_viewed` where `screen = create_household`

**Settings:**

- Conversion window: 7 days
- Unique users

**Save as:** "Onboarding Funnel"

---

## 2. Survey Drop-off Funnel

**Where:** Insights → New Insight → Funnel

**Steps (in order):**

1. `onboarding_screen_viewed` where `screen = survey_start`
2. `survey_question_answered` where `question_number = 1`
3. `survey_question_answered` where `question_number = 2`
4. `survey_question_answered` where `question_number = 3`
5. `survey_question_answered` where `question_number = 4`
6. `survey_question_answered` where `question_number = 5`
7. `survey_question_answered` where `question_number = 6`
8. `survey_question_answered` where `question_number = 7`
9. `survey_question_answered` where `question_number = 8`
10. `survey_question_answered` where `question_number = 9`

**Save as:** "Survey Completion Funnel"

---

## 3. Survey Answer Distribution (one per question)

**Where:** Insights → New Insight → Bar Chart

For each question you care about:

- Event: `survey_question_answered`
- Filter: `question_key = <key>` (e.g. `cooking_frequency`)
- Breakdown: `selected_options`
- Aggregation: Count of unique users

> Tip: Create one chart per question, or use a single chart with breakdown by `question_key` to compare all questions at once.

**Save as:** "Survey Answers – [question name]"

## 4. Verify Events Are Firing

Before building the insights, walk through the onboarding flow on staging and confirm events appear:

**Where:** Activity → Live Events

**Check for:**

- `onboarding_screen_viewed` with correct `screen` value on each step
- `survey_question_answered` with `question_number`, `question_key`, `selected_options` after answering a survey question

---

---

## 5. Error Tracking

PostHog captures exceptions as `$exception` events. Three layers report errors:

| Source | How | Extra Properties |
|--------|-----|-----------------|
| Unhandled JS errors | `capture_exceptions: true` (automatic) | stack trace |
| React render errors | `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) | `component_stack` |
| React Query failures | `QueryCache.onError` in `main.tsx` | `query_key` |
| Manual (catch blocks) | `useErrorTracking().captureError()` | any custom context |

**Where to view:** PostHog → **Error Tracking** tab (not Insights — PostHog has a dedicated UI for exceptions).

**Using `useErrorTracking` in catch blocks:**

```typescript
import { useErrorTracking } from "@/hooks/analytics/useErrorTracking";

function MyComponent() {
  const { captureError } = useErrorTracking();

  async function handleSubmit() {
    try {
      await someApi.call();
    } catch (err) {
      captureError(err as Error, { context: "MyComponent.handleSubmit" });
      toast.error(t("errors.generic"));
    }
  }
}
```

---

## Notes

- Events fire in **production only** — PostHog provider is skipped in dev, so no test data will pollute your dashboard
- You can type event/property names manually in PostHog before any events have fired — insights will populate once real users go through the flows
