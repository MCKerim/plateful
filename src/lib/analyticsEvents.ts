/**
 * Canonical PostHog event names, shared with the native iOS app.
 *
 * The contract source is `plateful/Core/Analytics.swift` in the iOS repo
 * (plateful-ios); the full cross-platform catalog is documented there in
 * `docs/analytics.md`. Both apps report into the same PostHog project and
 * identify users by the lowercase Supabase user id, so funnels only work
 * while names AND property values match exactly — PostHog data is immutable,
 * drift can never be repaired retroactively. Never capture one of these with
 * a string literal at the call site; always go through this module.
 *
 * Property contracts (matching iOS):
 * - `recipe_import_*`: `source` is "url" | "photo" | "text" — the image
 *   import sends `photo` even though the DB row says `source_type: "image"`.
 *   "Succeeded" means the submission (the `recipe_imports` insert) was
 *   accepted; extraction runs async and reports its own failures.
 * - `signed_in`: `method` is a `SignInMethod` (src/lib/pendingSignIn.ts);
 *   `apple` comes from iOS and, since 2026-09-30, from the web (never Android:
 *   the button is web-only); `password` is iOS plus the web's review accounts.
 *   `platform` tells them apart.
 *   Captured after `posthog.identify()`, never at the call site — see
 *   pendingSignIn.ts for the mechanism and its limits. `magic_link` on both
 *   apps since 2026-09-11.
 * - `onboarding_screen_viewed`: `screen` is an `OnboardingScreen` key from
 *   `src/hooks/analytics/useOnboardingTracking.ts`; iOS sends the same keys
 *   (plus a few for screens only it has) from `Analytics.OnboardingScreen`.
 * - `survey_question_answered`: `question_number` (position in
 *   `SURVEY_QUESTIONS`, i.e. the stored `survey_answers.question_number`),
 *   `question_key` ("question1"…), `selected_options` ("option1"…). Same
 *   shape on iOS.
 * - `subscription_purchased` / `subscription_restored`: iOS adds `product_id`
 *   and `is_trial` (2026-09-11); this app sends neither yet.
 * - `recipe_rated`: `rating` (stars, number) + `is_edit` (boolean).
 * - `household_created` / `household_joined`: `household_id`, lowercase —
 *   Postgres ids already are; never uppercase them.
 * - `household_left`: `outcome` is the `leave_household` RPC result string.
 * - `shopping_list_items_added`: `source` is "manual" | "recipe" | "plan",
 *   `count` is 1 for a typed line, else the items touched.
 * - `shopping_list_recipe_removed`: `count` is the items the recipe touched.
 * - `cooking_started` (a session created, not resumed or joined),
 *   `cooking_finished` / `cooking_abandoned` (this cook left through Finish
 *   or the close button), `cooking_timer_started`: no properties, as on iOS.
 * - `planner_meal_type_set`: `meal_type` (the picked type) and
 *   `differs_from_default` (against the course-tag type). Sent for a recipe
 *   only, never a note: from the Plan sheet on a save that inserts,
 *   only when the user picked a type, and from a planner entry's menu on a
 *   change.
 * - `mcp_connect_opened`: `client` is "claude" | "chatgpt", the connect button
 *   tapped on the Claude & ChatGPT page; sent as its link opens.
 */
export const AnalyticsEvent = {
  magicLinkRequested: "magic_link_requested",
  signedIn: "signed_in",
  onboardingScreenViewed: "onboarding_screen_viewed",
  surveyQuestionAnswered: "survey_question_answered",
  recipeCreated: "recipe_created",
  recipeImportStarted: "recipe_import_started",
  recipeImportSucceeded: "recipe_import_succeeded",
  recipeImportFailed: "recipe_import_failed",
  recipeShareLinkCreated: "recipe_share_link_created",
  sharedRecipeImported: "shared_recipe_imported",
  recipeRated: "recipe_rated",
  /**
   * A save changed how a recipe's nutrition is managed (`enabled`: the new
   * `nutrition_auto` state). Fired for edits only — a recipe created with the
   * toggle off was never auto-managed and would inflate the metric.
   */
  nutritionAutoToggled: "nutrition_auto_toggled",
  /** The editor's "Reset to original" succeeded; the iOS event, no properties. */
  recipeResetToOriginal: "recipe_reset_to_original",
  subscriptionPurchased: "subscription_purchased",
  subscriptionRestored: "subscription_restored",
  householdCreated: "household_created",
  householdJoined: "household_joined",
  householdLeft: "household_left",
  householdMemberRemoved: "household_member_removed",
  pushPermissionGranted: "push_permission_granted",
  pushPermissionDenied: "push_permission_denied",
  shoppingListItemsAdded: "shopping_list_items_added",
  shoppingListRecipeRemoved: "shopping_list_recipe_removed",
  cookingStarted: "cooking_started",
  cookingFinished: "cooking_finished",
  cookingAbandoned: "cooking_abandoned",
  cookingTimerStarted: "cooking_timer_started",
  plannerMealTypeSet: "planner_meal_type_set",
  mcpConnectOpened: "mcp_connect_opened",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
