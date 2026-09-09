import { useMutation } from "@tanstack/react-query";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";

/**
 * Writes the chosen first weekday into `users.week_start`. The caller updates
 * Redux first (the planner regroups at once) and puts the old value back on
 * failure; the users realtime stream carries the change to other devices.
 */
export function useUpdateWeekStart() {
  const { supabase } = useSupabase();

  return useMutation({
    mutationFn: async (params: { userId: string; weekStart: number }) => {
      return userApi.updateWeekStart(supabase, params);
    },
  });
}
