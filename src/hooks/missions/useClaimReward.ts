import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { missionsApi } from "@/api/missions.api";
import { queryKeys } from "@/lib/query-keys";

type ClaimRewardParams = { missionSet: string; badgeId: string };

export function useClaimReward() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);

  return useMutation({
    mutationFn: async ({ missionSet, badgeId }: ClaimRewardParams) => {
      if (!householdId || !user?.id) throw new Error("Not authenticated");
      await missionsApi.claimReward(supabase, householdId, user.id, missionSet, badgeId);
    },
    onSuccess: () => {
      if (!householdId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.missions.householdRewards(householdId),
      });
    },
  });
}
