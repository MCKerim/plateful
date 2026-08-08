import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database.types";

/** A household member who holds a live store entitlement, as selected below.
 * `store`/`environment` exist on the view for support queries but the app has
 * no use for them, so they stay out of the shape it hands around. */
export type HouseholdEntitlement = Pick<
  Tables<"household_entitlements">,
  "household_id" | "user_id" | "username" | "expires_at"
>;

export const subscriptionApi = {
  /**
   * The household's live entitlements.
   *
   * Entitlements are stored per user (`user_subscriptions`) and this view joins
   * them to whoever is a member right now, so premium is derived rather than
   * stored: it follows the person out of one household and into the next, and
   * no membership change needs subscription code of its own.
   *
   * The view already filters on the active flag and the expiry, so any row means
   * premium and no rows means paywalled.
   */
  async listByHouseholdId(
    supabase: SupabaseClient<Database>,
    householdId: string
  ): Promise<HouseholdEntitlement[]> {
    const { data, error } = await supabase
      .from("household_entitlements")
      .select("household_id, user_id, username, expires_at")
      .eq("household_id", householdId);

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  /**
   * Waits for the RevenueCat webhook to record the entitlement after a
   * purchase. The client has no write access to `user_subscriptions` (a
   * client-writable row would let anyone self-grant premium), so the webhook is
   * the only writer — it typically lands within a few seconds. Resolves `true`
   * once the household is covered, `false` on timeout; the caller should
   * invalidate the subscription query either way.
   */
  async waitUntilActive(
    supabase: SupabaseClient<Database>,
    householdId: string,
    { attempts = 10, intervalMs = 1000 } = {}
  ): Promise<boolean> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const entitlements = await subscriptionApi.listByHouseholdId(
          supabase,
          householdId
        );
        if (entitlements.length > 0) {
          return true;
        }
      } catch {
        // Transient fetch error — keep polling until the attempts run out.
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return false;
  },
};
