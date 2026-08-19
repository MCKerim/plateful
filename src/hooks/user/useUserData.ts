import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/slices/userSlice";
import { setHousehold, setHouseholdMembers } from "@/redux/slices/householdSlice";
import { useSupabase } from "@/utils/supabase";
import { userApi } from "@/api/user.api";
import type { CurrentAuthUser } from "@/api/user.api";
import posthog from "posthog-js";
import { contentLanguage } from "@/lib/contentLanguage";
import { identifyUser, logoutUser } from "@/lib/revenuecat";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { setCustomerInfo, resetSubscription } from "@/redux/slices/subscriptionSlice";

export type UserDataLoadResult =
  | { status: "ready" }
  | { status: "signed_out" }
  | { status: "superseded" }
  | { status: "failed"; stage: "profile" | "household" };

type IsCurrentLoad = () => boolean;

export type FetchUserDataOptions = {
  /**
   * Whether this load is a real sign-out — a known user becoming nobody.
   *
   * PostHog's `reset()` is a logout *event* handler, not a signed-out *state*
   * handler: every call mints a fresh anonymous distinct_id and session id. The
   * signed-out branch below also runs for visitors who were never signed in
   * (Supabase hands every new `onAuthStateChange` subscriber a null session), so
   * calling it unconditionally shredded a single visitor into hundreds of
   * "persons". Only the caller knows whether the identity actually changed.
   */
  resetAnalyticsIdentity?: boolean;
};

let languageSynchronizationQueue: Promise<void> = Promise.resolve();
let revenueCatIdentityQueue: Promise<void> = Promise.resolve();

export function useUserData() {
  const { supabase } = useSupabase();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const fetchUserData = useCallback(
    async (
      authUser: CurrentAuthUser | null,
      isCurrent: IsCurrentLoad = () => true,
      { resetAnalyticsIdentity = false }: FetchUserDataOptions = {}
    ): Promise<UserDataLoadResult> => {
      if (!isCurrent()) {
        return { status: "superseded" };
      }

      if (!authUser) {
        dispatch(setUser(null));
        dispatch(setHousehold(null));
        dispatch(setHouseholdMembers(null));
        dispatch(resetSubscription());
        queryClient.clear();
        if (resetAnalyticsIdentity) {
          posthog.reset();
        }
        revenueCatIdentityQueue = revenueCatIdentityQueue
          .catch(() => undefined)
          .then(async () => {
            if (!isCurrent()) return;
            await logoutUser();
          })
          .catch((err) => console.error("Failed to logout from RevenueCat:", err));
        SocialLogin.logout({ provider: "google" }).catch(() => {
          // Ignore — user may not have signed in with Google
        });
        return { status: "signed_out" };
      }

      let userData;
      try {
        userData = await userApi.getCurrent(supabase, authUser);
      } catch (error) {
        // The auth event is the source of truth for whether a session exists.
        // A profile request failure must not turn a signed-in session into a
        // client-side logout.
        console.error("Error fetching current user profile:", error);
        return isCurrent() ? { status: "failed", stage: "profile" } : { status: "superseded" };
      }

      if (!isCurrent()) {
        return { status: "superseded" };
      }

      let householdData: Awaited<ReturnType<typeof userApi.getHousehold>> | null = null;
      let membersData: Awaited<ReturnType<typeof userApi.getHouseholdMembers>> | null = null;
      if (!userData.household_id) {
        householdData = null;
        membersData = null;
      } else {
        try {
          [householdData, membersData] = await Promise.all([
            userApi.getHousehold(supabase, userData.household_id),
            userApi.getHouseholdMembers(supabase, userData.household_id),
          ]);
        } catch (error) {
          console.error("Error fetching household data:", error);
          return isCurrent() ? { status: "failed", stage: "household" } : { status: "superseded" };
        }
      }

      if (!isCurrent()) {
        return { status: "superseded" };
      }

      // Publish the profile and its tenant data as one guarded bootstrap
      // result. The UI remains behind the loading/error gate until all three
      // dispatches complete, so it cannot route using a half-loaded household.
      dispatch(setUser(userData));
      dispatch(setHousehold(householdData));
      dispatch(setHouseholdMembers(membersData));

      try {
        posthog.identify(userData.id, {
          email: userData.email,
          username: userData.username,
          // iOS sets the same person property (lowercase, as Postgres stores
          // it) — without it, household-level segmentation only sees iOS
          // users. Omitted while null so a not-yet-onboarded user keeps any
          // previously recorded household.
          ...(userData.household_id ? { household_id: userData.household_id } : {}),
        });
      } catch (error) {
        console.error("Failed to identify user with PostHog:", error);
      }

      // Language and billing identity are useful integrations, but neither is
      // allowed to hold the authenticated app bootstrap open. Queuing them
      // preserves auth-event order during rapid sign-out/account switching.
      //
      // This reports the language upward and never pulls it down. The device
      // owns which language the app renders in (i18next's detector, cached in
      // localStorage); `users.language` is a write-only mirror that only the
      // server reads, for recipes generated where there is no request to take
      // a language from. Reading it back is what let an English iPhone
      // silently undo a German choice made here. See docs/language.md in
      // ~/programming/ios-native/plateful.
      languageSynchronizationQueue = languageSynchronizationQueue
        .catch(() => undefined)
        .then(async () => {
          if (!isCurrent()) return;

          const currentLanguage = contentLanguage();
          if (userData.language === currentLanguage) return;

          try {
            await userApi.updateLanguage(supabase, {
              userId: userData.id,
              language: currentLanguage,
            });
          } catch (error) {
            console.error("Failed to report the current language:", error);
          }
        })
        .catch((error) => console.error("Failed to synchronize user language:", error));

      revenueCatIdentityQueue = revenueCatIdentityQueue
        .catch(() => undefined)
        .then(async () => {
          if (!isCurrent()) return;
          const customerInfo = await identifyUser(userData.id, userData.email);
          if (isCurrent()) {
            dispatch(setCustomerInfo(customerInfo));
          }
        })
        .catch((error) => console.error("Failed to identify user with RevenueCat:", error));

      return { status: "ready" };
    },
    [supabase, dispatch, queryClient]
  );

  return { fetchUserData };
}
