import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { missionsApi } from "@/api/missions.api";
import { queryKeys } from "@/lib/query-keys";

export function useHouseholdMissions() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);

  return useQuery({
    queryKey: queryKeys.missions.householdMissions(householdId ?? ""),
    queryFn: () => missionsApi.getHouseholdMissions(supabase, householdId!),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });
}
