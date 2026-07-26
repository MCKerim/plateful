import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";
import type { CurrentAuthUser } from "@/api/user.api";
import posthog from "posthog-js";
import i18n from "@/i18n";
import { identifyUser, logoutUser } from "@/lib/revenuecat";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { setCustomerInfo, resetSubscription } from "@/redux/slices/subscriptionSlice";

export function useUserData() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const fetchUserData = useCallback(
    async (authUser: CurrentAuthUser | null): Promise<void> => {
      if (!authUser) {
        dispatch(setUser(null));
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
        dispatch(resetSubscription());
        queryClient.clear();
        posthog.reset();
        logoutUser().catch((err) => console.error("Failed to logout from RevenueCat:", err));
        SocialLogin.logout({ provider: "google" }).catch(() => {
          // Ignore — user may not have signed in with Google
        });
        return;
      }

      let userData;
      try {
        userData = await userApi.getCurrent(supabase, authUser);
      } catch (error) {
        // The auth event is the source of truth for whether a session exists.
        // A profile request failure must not turn a signed-in session into a
        // client-side logout.
        console.error("Error fetching current user profile:", error);
        return;
      }

      dispatch(setUser(userData));

      try {
        // Keep language setup independent from authentication state.
        const storedLanguage = userData.language;
        const detectedLanguage = i18n.language.split("-")[0]; // 'en-US' -> 'en'
        const supportedLanguages = ["en", "de"];

        if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
          // Apply stored language from Supabase
          if (i18n.language !== storedLanguage) {
            await i18n.changeLanguage(storedLanguage);
          }
          localStorage.setItem("language", storedLanguage);
        } else {
          // First-time user: save detected language to Supabase
          const languageToSave = supportedLanguages.includes(detectedLanguage)
            ? detectedLanguage
            : "en";

          userApi
            .updateLanguage(supabase, {
              userId: userData.id,
              language: languageToSave,
            })
            .catch((err) => console.error("Failed to save detected language:", err));

          await i18n.changeLanguage(languageToSave);
          localStorage.setItem("language", languageToSave);
        }
      } catch (error) {
        console.error("Failed to synchronize user language:", error);
      }

      try {
        posthog.identify(userData.id, {
          email: userData.email,
          username: userData.username,
        });
      } catch (error) {
        console.error("Failed to identify user with PostHog:", error);
      }

      try {
        const customerInfo = await identifyUser(userData.id, userData.email);
        dispatch(setCustomerInfo(customerInfo));
      } catch (error) {
        console.error("Failed to identify user with RevenueCat:", error);
      }

      if (!userData.household_id) {
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
        return;
      }

      try {
        const [householdData, membersData] = await Promise.all([
          userApi.getHousehold(supabase, userData.household_id),
          userApi.getHouseholdMembers(supabase, userData.household_id),
        ]);
        dispatch(setHousehold(householdData));
        dispatch(setHouseholdMembers(membersData));
      } catch (error) {
        // Household data can be retried independently. Clearing the user here
        // made a transient tenant-data failure look like an authentication loss.
        console.error("Error fetching household data:", error);
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
      }
    },
    [supabase, dispatch, queryClient]
  );

  return { fetchUserData };
}
