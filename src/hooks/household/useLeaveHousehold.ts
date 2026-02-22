import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectHousehold, selectHouseholdMembers, setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { householdApi, LeaveHouseholdParams } from "@/api/household.api";

export function useLeaveHousehold() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const household = useAppSelector(selectHousehold);
  const members = useAppSelector(selectHouseholdMembers);

  return useMutation({
    mutationFn: async (params: LeaveHouseholdParams) => {
      if (!household) throw new Error("No household");

      const isOwner = household.owner_id === params.userId;
      const otherMembers = members?.filter((m) => m.id !== params.userId) ?? [];

      if (isOwner && otherMembers.length > 0) {
        // Transfer ownership to earliest-joined member before leaving
        const earliestMember = otherMembers.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];

        await householdApi.transferOwnership(supabase, {
          householdId: household.id,
          newOwnerId: earliestMember.id,
        });

        return householdApi.leaveHousehold(supabase, params);
      }

      if (isOwner && otherMembers.length === 0) {
        // Last member leaving — delete the household
        return householdApi.deleteHousehold(supabase, { householdId: household.id });
      }

      // Regular member leaving
      return householdApi.leaveHousehold(supabase, params);
    },
    onSuccess: () => {
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
    },
  });
}
