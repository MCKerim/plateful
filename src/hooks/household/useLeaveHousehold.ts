import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch } from "@/redux/hooks";
import { setHousehold } from "@/redux/slices/householdSlice";
import { householdApi, LeaveHouseholdParams } from "@/api/household.api";

export function useLeaveHousehold() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (params: LeaveHouseholdParams) => {
      return householdApi.leaveHousehold(supabase, params);
    },
    onSuccess: () => {
      dispatch(setHousehold(null));
    },
  });
}
