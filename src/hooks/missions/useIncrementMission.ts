import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { missionsApi } from "@/api/missions.api";
import { queryKeys } from "@/lib/query-keys";
import { HouseholdMission } from "@/types/missions.types";

type IncrementParams = { missionId: string; count?: number };

export function useIncrementMission() {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const householdId = useAppSelector(selectHouseholdId);

  return useMutation({
    mutationFn: async ({ missionId, count = 1 }: IncrementParams): Promise<boolean> => {
      if (!householdId) return false;

      const cached = queryClient.getQueryData<HouseholdMission[]>(
        queryKeys.missions.householdMissions(householdId)
      );
      const mission = cached?.find((m) => m.missionId === missionId);
      if (mission?.completed) return false;

      await Promise.all(
        Array.from({ length: count }, () =>
          missionsApi.incrementMission(supabase, householdId, missionId)
        )
      );
      return true;
    },
    onSuccess: (incremented) => {
      if (!incremented || !householdId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.missions.householdMissions(householdId),
      });
    },
  });
}
