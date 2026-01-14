import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";

export function useUpdateLanguage() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: { userId: string; language: string }) => {
      return userApi.updateLanguage(supabase, params);
    },
  });
}
