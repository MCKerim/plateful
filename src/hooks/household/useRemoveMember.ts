import { useMutation } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectHouseholdMembers, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { AnalyticsEvent } from "@/lib/analyticsEvents";
import { householdApi, RemoveMemberParams } from "@/api/household.api";

export function useRemoveMember() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectHouseholdMembers);
  const posthog = usePostHog();

  return useMutation({
    mutationFn: async (params: RemoveMemberParams) => {
      return householdApi.removeMember(supabase, params);
    },
    onSuccess: (_, params) => {
      posthog?.capture(AnalyticsEvent.householdMemberRemoved);
      if (members) {
        dispatch(setHouseholdMembers(members.filter((member) => member.id !== params.memberId)));
      }
    },
  });
}
