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
    queryFn: () => subscriptionApi.listByHouseholdId(supabase, householdId!),
    enabled: !!householdId,
    staleTime: 1000 * 60 * 5,
  });

  const entitlements = query.data ?? [];

  return {
    ...query,
    entitlements,
    // Any live entitlement in the household unlocks it for everyone in it.
    isActive: entitlements.length > 0,
    // More than one member paying for the same household. Only reachable by two
    // solo subscribers moving in together, and only they can cancel, in the
    // store — so it is surfaced rather than silently charged twice.
    hasOverlappingSubscriptions: entitlements.length > 1,
  };
}
