import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database.types";

export type HouseholdSubscriptionWithPayer = Tables<"household_subscriptions"> & {
  payer: { username: string | null } | null;
};

export const subscriptionApi = {
  async getByHouseholdId(
    supabase: SupabaseClient<Database>,
    householdId: string
  ): Promise<HouseholdSubscriptionWithPayer | null> {
    const { data, error } = await supabase
      .from("household_subscriptions")
      .select("*, payer:payer_user_id(username)")
      .eq("household_id", householdId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as HouseholdSubscriptionWithPayer | null;
  },

  /**
   * Waits for the RevenueCat webhook to activate the household's row after a
   * purchase. The client has no write access to `household_subscriptions`
   * (a client-writable row would let anyone self-grant premium), so the
   * webhook is the only writer — it typically lands within a few seconds.
   * Resolves `true` once active, `false` on timeout; the caller should
   * invalidate the subscription query either way.
   */
  async waitUntilActive(
    supabase: SupabaseClient<Database>,
    householdId: string,
    { attempts = 10, intervalMs = 1000 } = {}
  ): Promise<boolean> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const row = await subscriptionApi.getByHouseholdId(supabase, householdId);
        if (row?.is_active) {
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
