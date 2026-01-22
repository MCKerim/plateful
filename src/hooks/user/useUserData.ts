import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import {
  setHousehold,
  setHouseholdMembers,
} from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";
import posthog from "posthog-js";

export function useUserData() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const fetchUserData = useCallback(
    async (userId: string | null): Promise<void> => {
      if (!userId) {
        dispatch(setUser(null));
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
        queryClient.clear();
        posthog.reset();
        return;
      }

      try {
        const userData = await userApi.getById(supabase, userId);

        if (!userData) {
          dispatch(setUser(null));
          dispatch(setHousehold(null));
          dispatch(setHouseholdMembers(null));
          posthog.reset();
          return;
        }

        dispatch(setUser(userData));
        dispatch(setHousehold(userData.household ?? null));

        posthog.identify(userData.id, {
          email: userData.email,
          username: userData.username,
        });

        if (!userData.household_id) {
          return;
        }

        const membersData = await userApi.getHouseholdMembers(
          supabase,
          userData.household_id
        );
        dispatch(setHouseholdMembers(membersData));
      } catch (error) {
        console.error("Error fetching user data:", error);
        dispatch(setUser(null));
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
        posthog.reset();
      }
    },
    [supabase, dispatch, queryClient]
  );

  return { fetchUserData };
}
