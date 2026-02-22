import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectHousehold, setHousehold } from "@/redux/slices/householdSlice";
import { householdApi, TransferOwnershipParams } from "@/api/household.api";

export function useTransferOwnership() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const household = useAppSelector(selectHousehold);

  return useMutation({
    mutationFn: async (params: TransferOwnershipParams) => {
      return householdApi.transferOwnership(supabase, params);
    },
    onSuccess: (_, params) => {
      if (household) {
        dispatch(setHousehold({ ...household, owner_id: params.newOwnerId }));
      }
    },
  });
}
