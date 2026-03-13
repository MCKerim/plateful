import { useCallback } from "react";
import { RevenueCatUI } from "@revenuecat/purchases-capacitor-ui";
import { PAYWALL_RESULT } from "@revenuecat/purchases-capacitor";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCustomerInfo } from "@/redux/slices/subscriptionSlice";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import { selectUser } from "@/redux/slices/userSlice";
import { getCustomerInfo, isNativePlatform } from "@/lib/revenuecat";
import { subscriptionApi } from "@/api/subscription.api";
import { queryKeys } from "@/lib/query-keys";
import { useSupabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function usePresentPaywall() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { supabase } = useSupabase();
  const householdId = useAppSelector(selectHouseholdId);
  const user = useAppSelector(selectUser);

  const presentPaywall = useCallback(
    async (options?: { displayCloseButton?: boolean }) => {
      if (!isNativePlatform()) {
        toast.info(t("subscription.notAvailableOnWeb"));
        return null;
      }

      try {
        const { result } = await RevenueCatUI.presentPaywall({
          displayCloseButton: options?.displayCloseButton ?? true,
        });

        if (
          result === PAYWALL_RESULT.PURCHASED ||
          result === PAYWALL_RESULT.RESTORED
        ) {
          const customerInfo = await getCustomerInfo();
          dispatch(setCustomerInfo(customerInfo));

          if (householdId && user?.id) {
            await subscriptionApi.upsert(supabase, {
              householdId,
              payerUserId: user.id,
              isActive: true,
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.subscription.byHousehold(householdId),
            });
          }

          if (result === PAYWALL_RESULT.PURCHASED) {
            toast.success(t("subscription.purchaseSuccess"));
          } else {
            toast.success(t("subscription.restoreSuccess"));
          }
        }

        return result;
      } catch (error) {
        console.error("Paywall presentation error:", error);
        toast.error(t("subscription.paywallError"));
        return null;
      }
    },
    [dispatch, t, householdId, user, supabase, queryClient]
  );

  return { presentPaywall };
}
