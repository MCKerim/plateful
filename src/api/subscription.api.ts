import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database.types";

export type HouseholdSubscriptionWithPayer = Tables<"household_subscriptions"> & {
  payer: { username: string | null } | null;
};

export type UpsertSubscriptionParams = {
  householdId: string;
  payerUserId: string;
  isActive: boolean;
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

  async upsert(
    supabase: SupabaseClient<Database>,
    params: UpsertSubscriptionParams
  ): Promise<void> {
    const { error } = await supabase
      .from("household_subscriptions")
      .upsert(
        {
          household_id: params.householdId,
          payer_user_id: params.payerUserId,
          is_active: params.isActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "household_id" }
      );

    if (error) {
      throw error;
    }
  },
};
