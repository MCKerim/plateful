import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";

export function useCompleteOnboarding() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: { userId: string; username: string }) => {
      return userApi.completeOnboarding(supabase, params);
    },
  });
}
