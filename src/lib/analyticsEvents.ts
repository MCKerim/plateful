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
 * - `signed_in`: `method` is "google" | "apple" | "password". Magic-link
 *   completion deliberately emits nothing (iOS doesn't either);
 *   `magic_link_requested` covers the email path.
 * - `recipe_rated`: `rating` (stars, number) + `is_edit` (boolean).
 * - `household_created` / `household_joined`: `household_id`, lowercase —
 *   Postgres ids already are; never uppercase them.
 * - `household_left`: `outcome` is the `leave_household` RPC result string.
 */
export const AnalyticsEvent = {
  magicLinkRequested: "magic_link_requested",
  signedIn: "signed_in",
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
  subscriptionPurchased: "subscription_purchased",
  subscriptionRestored: "subscription_restored",
  householdCreated: "household_created",
  householdJoined: "household_joined",
  householdLeft: "household_left",
  householdMemberRemoved: "household_member_removed",
  pushPermissionGranted: "push_permission_granted",
  pushPermissionDenied: "push_permission_denied",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
