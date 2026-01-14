import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export type UserWithHousehold = Database["public"]["Tables"]["users"]["Row"] & {
  household: Database["public"]["Tables"]["household"]["Row"] | null;
};

export type HouseholdMember = {
  id: string;
  email: string;
  username: string;
};

export const userApi = {
  async getById(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<UserWithHousehold | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*, household:household_id(*)")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data as UserWithHousehold;
  },

  async getHouseholdMembers(
    supabase: SupabaseClient<Database>,
    householdId: number
  ): Promise<HouseholdMember[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("household_id", householdId);

    if (error) {
      throw error;
    }

    return data as HouseholdMember[];
  },
};
