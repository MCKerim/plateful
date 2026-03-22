import { SupabaseClient } from "@supabase/supabase-js";
import { HouseholdMission, HouseholdReward } from "@/types/missions.types";

export const missionsApi = {
  async getHouseholdMissions(
    supabase: SupabaseClient,
    householdId: string
  ): Promise<HouseholdMission[]> {
    const [{ data: definitions, error: defError }, { data: progress, error: progressError }] =
      await Promise.all([
        supabase.from("mission_definitions").select("*"),
        supabase.from("household_missions").select("*").eq("household_id", householdId),
      ]);

    if (defError) throw defError;
    if (progressError) throw progressError;

    const progressByMissionId = Object.fromEntries(
      (progress ?? []).map((row) => [row.mission_id, row])
    );

    return (definitions ?? []).map((def) => {
      const row = progressByMissionId[def.id];
      return {
        missionId: def.id,
        missionSet: def.mission_set,
        scope: def.scope as "household" | "user",
        requiredCount: def.required_count,
        progress: row?.progress ?? 0,
        completed: row?.completed_at != null,
        completedAt: row?.completed_at ?? null,
      };
    });
  },

  async incrementMission(
    supabase: SupabaseClient,
    householdId: string,
    missionId: string
  ): Promise<void> {
    const { error } = await supabase.rpc("increment_household_mission", {
      p_household_id: householdId,
      p_mission_id: missionId,
    });
    if (error) throw error;
  },

  async claimReward(
    supabase: SupabaseClient,
    householdId: string,
    userId: string,
    missionSet: string,
    badgeId: string
  ): Promise<void> {
    const { error } = await supabase.from("household_rewards").insert({
      household_id: householdId,
      mission_set: missionSet,
      badge_id: badgeId,
      claimed_by: userId,
    });
    if (error) throw error;
  },

  async getHouseholdRewards(
    supabase: SupabaseClient,
    householdId: string
  ): Promise<HouseholdReward[]> {
    const { data, error } = await supabase
      .from("household_rewards")
      .select("*")
      .eq("household_id", householdId);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      missionSet: row.mission_set,
      badgeId: row.badge_id,
      claimedAt: row.claimed_at,
      claimedBy: row.claimed_by,
    }));
  },
};
