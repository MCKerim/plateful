import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export type UpdateHouseholdNameParams = {
  householdId: string;
  name: string;
};

export type CreateHouseholdParams = {
  name: string;
};

export type RemoveMemberParams = {
  memberId: string;
};

export type TransferOwnershipParams = {
  newOwnerId: string;
};

export type LeaveHouseholdResult =
  | "member_left"
  | "ownership_transferred"
  | "household_deleted"
  | "not_member";

const leaveHouseholdResults = new Set<LeaveHouseholdResult>([
  "member_left",
  "ownership_transferred",
  "household_deleted",
  "not_member",
]);

export const householdApi = {
  async create(supabase: SupabaseClient<Database>, params: CreateHouseholdParams): Promise<string> {
    const { data, error } = await supabase.rpc("create_household", {
      p_name: params.name,
    });

    if (error) {
      throw error;
    }

    if (typeof data !== "string" || !data) {
      throw new Error("The household service returned an invalid identifier.");
    }

    return data;
  },

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
    const { error } = await supabase.rpc("remove_household_member", {
      p_member_id: params.memberId,
    });

    if (error) {
      throw error;
    }
  },

  async leaveHousehold(supabase: SupabaseClient<Database>): Promise<LeaveHouseholdResult> {
    const { data, error } = await supabase.rpc("leave_household");

    if (error) {
      throw error;
    }

    if (typeof data !== "string" || !leaveHouseholdResults.has(data as LeaveHouseholdResult)) {
      throw new Error("The household service returned an invalid leave result.");
    }

    return data as LeaveHouseholdResult;
  },

  async transferOwnership(
    supabase: SupabaseClient<Database>,
    params: TransferOwnershipParams
  ): Promise<void> {
    const { error } = await supabase.rpc("transfer_household_ownership", {
      p_member_id: params.newOwnerId,
    });

    if (error) {
      throw error;
    }
  },

  async deleteHousehold(supabase: SupabaseClient<Database>): Promise<void> {
    const { error } = await supabase.rpc("delete_household");

    if (error) {
      throw error;
    }
  },
};
