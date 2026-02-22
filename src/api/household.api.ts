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

export type TransferOwnershipParams = {
  householdId: string;
  newOwnerId: string;
};

export type DeleteHouseholdParams = {
  householdId: string;
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

  async transferOwnership(
    supabase: SupabaseClient<Database>,
    params: TransferOwnershipParams
  ): Promise<void> {
    const { error } = await supabase
      .from("household")
      .update({ owner_id: params.newOwnerId })
      .eq("id", params.householdId);

    if (error) {
      throw error;
    }
  },

  async deleteHousehold(
    supabase: SupabaseClient<Database>,
    params: DeleteHouseholdParams
  ): Promise<void> {
    // Cascade delete handles recipes, meal plans, cookbooks, invites.
    // Users are unlinked (household_id set to null) automatically.
    const { error } = await supabase
      .from("household")
      .delete()
      .eq("id", params.householdId);

    if (error) {
      throw error;
    }
  },
};
