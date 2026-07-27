import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database.types";
import { NotificationPreferences } from "@/types/notification.types";

type User = Database["public"]["Tables"]["users"]["Row"];
type Household = Database["public"]["Tables"]["household"]["Row"];

export type CurrentAuthUser = {
  id: string;
  email?: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  username: string;
  created_at: string;
};

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: { [key: string]: Json | undefined }, key: string): string {
  const candidate = value[key];
  if (typeof candidate !== "string" || !candidate) {
    throw new Error(`The profile service returned an invalid ${key}.`);
  }
  return candidate;
}

function optionalString(value: { [key: string]: Json | undefined }, key: string): string | null {
  const candidate = value[key];
  if (candidate === null || candidate === undefined) {
    return null;
  }
  if (typeof candidate !== "string") {
    throw new Error(`The profile service returned an invalid ${key}.`);
  }
  return candidate;
}

export function parseCurrentProfile(
  value: Json
): Omit<User, "created_at" | "deletion_requested_at" | "email"> {
  if (!isJsonObject(value)) {
    throw new Error("The profile service returned an invalid profile.");
  }

  const hasCompletedSurvey = value.has_completed_survey;
  if (typeof hasCompletedSurvey !== "boolean") {
    throw new Error("The profile service returned an invalid survey state.");
  }

  const notificationPreferences = value.notification_preferences;
  if (
    notificationPreferences !== null &&
    notificationPreferences !== undefined &&
    !isJsonObject(notificationPreferences)
  ) {
    throw new Error("The profile service returned invalid notification preferences.");
  }

  return {
    id: requiredString(value, "id"),
    username: requiredString(value, "username"),
    household_id: optionalString(value, "household_id"),
    language: optionalString(value, "language"),
    has_completed_survey: hasCompletedSurvey,
    notification_preferences: notificationPreferences ?? null,
  };
}

export const userApi = {
  async getCurrent(supabase: SupabaseClient<Database>, authUser: CurrentAuthUser): Promise<User> {
    const { data, error } = await supabase.rpc("get_current_profile");

    if (error) {
      throw error;
    }

    const email = authUser.email;
    if (!email) {
      throw new Error("The authenticated account has no email address.");
    }

    const profile = parseCurrentProfile(data);
    if (profile.id !== authUser.id) {
      throw new Error("The current profile did not match the authenticated account.");
    }

    return {
      ...profile,
      email,
      created_at: authUser.created_at,
      deletion_requested_at: null,
    };
  },

  async getHouseholdMembers(
    supabase: SupabaseClient<Database>,
    householdId: string
  ): Promise<HouseholdMember[]> {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data as HouseholdMember[];
  },

  async getHousehold(supabase: SupabaseClient<Database>, householdId: string): Promise<Household> {
    const { data, error } = await supabase
      .from("household")
      .select("id, name, owner_id, created_at")
      .eq("id", householdId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateUsername(
    supabase: SupabaseClient<Database>,
    params: { userId: string; username: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ username: params.username })
      .eq("id", params.userId);

    if (error) {
      throw error;
    }
  },

  async completeOnboarding(
    supabase: SupabaseClient<Database>,
    params: { userId: string; username: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ username: params.username, has_completed_survey: true })
      .eq("id", params.userId);

    if (error) {
      throw error;
    }
  },

  async updateLanguage(
    supabase: SupabaseClient<Database>,
    params: { userId: string; language: string }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ language: params.language })
      .eq("id", params.userId);

    if (error) {
      throw error;
    }
  },

  async updateNotificationPreferences(
    supabase: SupabaseClient<Database>,
    params: { userId: string; preferences: NotificationPreferences }
  ): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ notification_preferences: params.preferences as unknown as Json })
      .eq("id", params.userId);

    if (error) {
      throw error;
    }
  },
};
