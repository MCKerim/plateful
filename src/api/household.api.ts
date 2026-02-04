import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export type UpdateHouseholdNameParams = {
  householdId: string;
  name: string;
};

export type RemoveMemberParams = {
  memberId: string;
};

export type LeaveHouseholdParams = {
  userId: string;
};

export const householdApi = {
  async updateName(
    supabase: SupabaseClient<Database>,
    params: UpdateHouseholdNameParams
  ): Promise<void> {
    const { error } = await supabase
      .from("household")
      .update({ name: params.name })
      .eq("id", params.householdId);

    if (error) {
      throw error;
    }
  },

  async removeMember(
    supabase: SupabaseClient<Database>,
    params: RemoveMemberParams
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ household_id: null })
      .eq("id", params.memberId);

    if (error) {
      throw error;
    }
  },

  async leaveHousehold(
    supabase: SupabaseClient<Database>,
    params: LeaveHouseholdParams
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ household_id: null })
      .eq("id", params.userId);

    if (error) {
      throw error;
    }
  },
};
