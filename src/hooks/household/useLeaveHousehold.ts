import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { selectUser, setUser } from "@/redux/slices/userSlice";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { householdApi } from "@/api/household.api";

export function useLeaveHousehold() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async () => householdApi.leaveHousehold(supabase),
    onSuccess: (outcome) => {
      posthog?.capture(AnalyticsEvent.householdLeft, { outcome });
      if (user) {
        dispatch(setUser({ ...user, household_id: null }));
      }
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
    },
  });
}
