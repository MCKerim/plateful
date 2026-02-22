import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch } from "@/redux/hooks";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { householdApi, DeleteHouseholdParams } from "@/api/household.api";

export function useDeleteHousehold() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (params: DeleteHouseholdParams) => {
      return householdApi.deleteHousehold(supabase, params);
    },
    onSuccess: () => {
      dispatch(setHousehold(null));
      dispatch(setHouseholdMembers(null));
    },
  });
}
