import { useCallback } from "react";
import { RevenueCatUI } from "@revenuecat/purchases-capacitor-ui";
import { PAYWALL_RESULT } from "@revenuecat/purchases-capacitor";
import { useAppDispatch } from "@/redux/hooks";
import { setCustomerInfo } from "@/redux/slices/subscriptionSlice";
import { getCustomerInfo, isNativePlatform } from "@/lib/revenuecat";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function usePresentPaywall() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

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
    [dispatch, t]
  );

  return { presentPaywall };
}
