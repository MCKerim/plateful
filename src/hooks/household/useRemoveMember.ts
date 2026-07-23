import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectHouseholdMembers, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { householdApi, RemoveMemberParams } from "@/api/household.api";

export function useRemoveMember() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectHouseholdMembers);

  return useMutation({
    mutationFn: async (params: RemoveMemberParams) => {
      return householdApi.removeMember(supabase, params);
    },
    onSuccess: (_, params) => {
      if (members) {
        dispatch(setHouseholdMembers(members.filter((member) => member.id !== params.memberId)));
      }
    },
  });
}
