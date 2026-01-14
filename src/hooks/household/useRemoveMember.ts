import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { householdApi, RemoveMemberParams } from "@/api/household.api";

export function useRemoveMember() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: RemoveMemberParams) => {
      return householdApi.removeMember(supabase, params);
    },
  });
}
