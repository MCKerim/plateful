import { useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  selectIsPro,
  selectSubscriptionLoading,
  setCustomerInfo,
} from "@/redux/slices/subscriptionSlice";
import { restorePurchases as restorePurchasesApi } from "@/lib/revenuecat";
import { ENTITLEMENT_ID } from "@/types/subscription.types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useSubscription() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isPro = useAppSelector(selectIsPro);
  const isLoading = useAppSelector(selectSubscriptionLoading);

  const restorePurchases = useCallback(async () => {
    const toastId = toast.loading(t("subscription.restoring"));

    try {
      const customerInfo = await restorePurchasesApi();
      dispatch(setCustomerInfo(customerInfo));

      if (customerInfo?.entitlements.active[ENTITLEMENT_ID]) {
        toast.success(t("subscription.restoreSuccess"), { id: toastId });
      } else {
        toast.info(t("subscription.restoreNoPurchases"), { id: toastId });
      }
    } catch (error) {
      console.error("Failed to restore purchases:", error);
      toast.error(t("subscription.restoreError"), { id: toastId });
    }
  }, [dispatch, t]);

  return { isPro, isLoading, restorePurchases };
}
