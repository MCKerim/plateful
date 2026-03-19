import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppSelector } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { subscriptionApi } from "@/api/subscription.api";
import { queryKeys } from "@/lib/query-keys";

export function useHouseholdSubscription() {
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);

  const query = useQuery({
    queryKey: queryKeys.subscription.byHousehold(householdId ?? ""),
    queryFn: () => subscriptionApi.getByHouseholdId(supabase, householdId!),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query,
    isActive: query.data?.is_active === true,
  };
}
