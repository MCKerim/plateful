import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";
import posthog from "posthog-js";
import i18n from "@/i18n";
import { identifyUser, logoutUser } from "@/lib/revenuecat";
import { SocialLogin } from "@capgo/capacitor-social-login";
import {
  setCustomerInfo,
  resetSubscription,
} from "@/redux/slices/subscriptionSlice";

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
        dispatch(resetSubscription());
        queryClient.clear();
        posthog.reset();
        logoutUser().catch((err) =>
          console.error("Failed to logout from RevenueCat:", err)
        );
        SocialLogin.logout({ provider: "google" }).catch(() => {
          // Ignore — user may not have signed in with Google
        });
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

        // Sync language with i18n
        const storedLanguage = userData.language;
        const detectedLanguage = i18n.language.split("-")[0]; // 'en-US' -> 'en'
        const supportedLanguages = ["en", "de"];

        const accountAgeMs = Date.now() - new Date(userData.created_at).getTime();
        const isNewAccount = accountAgeMs < 2 * 60 * 1000; // within 2 minutes of sign-up

        if (!isNewAccount && storedLanguage && supportedLanguages.includes(storedLanguage)) {
          // Existing user: apply their stored language preference
          if (i18n.language !== storedLanguage) {
            i18n.changeLanguage(storedLanguage);
          }
          localStorage.setItem("language", storedLanguage);
        } else {
          // New account or no valid language stored: detect from browser and save
          const languageToSave = supportedLanguages.includes(detectedLanguage)
            ? detectedLanguage
            : "en";

          userApi
            .updateLanguage(supabase, {
              userId: userData.id,
              language: languageToSave,
            })
            .catch((err) => console.error("Failed to save detected language:", err));

          i18n.changeLanguage(languageToSave);
          localStorage.setItem("language", languageToSave);
        }

        posthog.identify(userData.id, {
          email: userData.email,
          username: userData.username,
        });

        try {
          const customerInfo = await identifyUser(userData.id, userData.email);
          dispatch(setCustomerInfo(customerInfo));
        } catch (err) {
          console.error("Failed to identify user with RevenueCat:", err);
        }

        if (!userData.household_id) {
          return;
        }

        const membersData = await userApi.getHouseholdMembers(supabase, userData.household_id);
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
