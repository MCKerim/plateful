import { useCallback } from "react";
import { RevenueCatUI } from "@revenuecat/purchases-capacitor-ui";
import { isNativePlatform } from "@/lib/revenuecat";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useCustomerCenter() {
  const { t } = useTranslation();

  const presentCustomerCenter = useCallback(async () => {
    if (!isNativePlatform()) {
      toast.info(t("subscription.notAvailableOnWeb"));
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error("Customer center error:", error);
      toast.error(t("subscription.customerCenterError"));
    }
  }, [t]);

  return { presentCustomerCenter };
}
