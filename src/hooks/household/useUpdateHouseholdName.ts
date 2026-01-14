import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectHousehold, setHousehold } from "@/redux/slices/householdSlice";
import { householdApi, UpdateHouseholdNameParams } from "@/api/household.api";

export function useUpdateHouseholdName() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const household = useAppSelector(selectHousehold);

  return useMutation({
    mutationFn: async (params: UpdateHouseholdNameParams) => {
      return householdApi.updateName(supabase, params);
    },
    onSuccess: (_, params) => {
      if (household) {
        dispatch(setHousehold({ ...household, name: params.name }));
      }
    },
  });
}
