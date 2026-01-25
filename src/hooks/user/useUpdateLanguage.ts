import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";
import i18n from "@/i18n";

export function useUpdateLanguage() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: { userId: string; language: string }) => {
      return userApi.updateLanguage(supabase, params);
    },
    onSuccess: (_, variables) => {
      i18n.changeLanguage(variables.language);
      localStorage.setItem("language", variables.language);
    },
  });
}
