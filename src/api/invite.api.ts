import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database.types";

export type InvitePreview =
  | {
      status: "ready";
      householdId: string;
      householdName: string;
      expiresAt: string;
    }
  | { status: "unavailable" };

export type AcceptInviteResult =
  | {
      status: "joined" | "already_member";
      householdId: string;
    }
  | { status: "must_leave_current_household" | "unavailable" };

export type InviteJoinRequirement = "can_join" | "already_member" | "must_leave_current_household";

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: { [key: string]: Json | undefined }, key: string): string {
  const candidate = value[key];
  if (typeof candidate !== "string" || !candidate) {
    throw new Error(`The invite service returned an invalid ${key}.`);
  }
  return candidate;
}

export function parseInvitePreview(value: Json): InvitePreview {
  if (!isJsonObject(value)) {
    throw new Error("The invite service returned an invalid preview.");
  }

  if (value.status === "unavailable") {
    return { status: "unavailable" };
  }

  if (value.status !== "ready") {
    throw new Error("The invite service returned an unknown preview status.");
  }

  const expiresAt = requiredString(value, "expires_at");
  if (Number.isNaN(Date.parse(expiresAt))) {
    throw new Error("The invite service returned an invalid expiry.");
  }

  return {
    status: "ready",
    householdId: requiredString(value, "household_id"),
    householdName: requiredString(value, "household_name"),
    expiresAt,
  };
}

export function parseAcceptInviteResult(value: Json): AcceptInviteResult {
  if (!isJsonObject(value)) {
    throw new Error("The invite service returned an invalid join result.");
  }

  if (value.status === "joined" || value.status === "already_member") {
    return {
      status: value.status,
      householdId: requiredString(value, "household_id"),
    };
  }

  if (value.status === "must_leave_current_household" || value.status === "unavailable") {
    return { status: value.status };
  }

  throw new Error("The invite service returned an unknown join status.");
}

export function getInviteJoinRequirement(
  currentHouseholdId: string | null,
  invitedHouseholdId: string
): InviteJoinRequirement {
  if (!currentHouseholdId) {
    return "can_join";
  }

  return currentHouseholdId === invitedHouseholdId
    ? "already_member"
    : "must_leave_current_household";
}

export const inviteApi = {
  async create(supabase: SupabaseClient<Database>): Promise<string> {
    const { data, error } = await supabase.rpc("create_household_invite");

    if (error) {
      throw error;
    }

    if (typeof data !== "string" || !data) {
      throw new Error("The invite service returned an invalid token.");
    }

    return data;
  },

  async preview(supabase: SupabaseClient<Database>, token: string): Promise<InvitePreview> {
    const { data, error } = await supabase.rpc("preview_household_invite", {
      p_token: token,
    });

    if (error) {
      throw error;
    }

    return parseInvitePreview(data);
  },

  async accept(supabase: SupabaseClient<Database>, token: string): Promise<AcceptInviteResult> {
    const { data, error } = await supabase.rpc("accept_household_invite", {
      p_token: token,
    });

    if (error) {
      throw error;
    }

    return parseAcceptInviteResult(data);
  },
};
