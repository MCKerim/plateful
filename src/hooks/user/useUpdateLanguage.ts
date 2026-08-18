import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";

/**
 * Reports the chosen language into `users.language`, which only the server
 * reads (recipe generation, new-household collection names). It deliberately
 * does NOT switch the interface: the device owns that, and the caller has
 * already switched it, so a failed or offline write can't strand the UI in the
 * old language. See docs/language.md in ~/programming/ios-native/plateful.
 */
export function useUpdateLanguage() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: { userId: string; language: string }) => {
      return userApi.updateLanguage(supabase, params);
    },
  });
}
