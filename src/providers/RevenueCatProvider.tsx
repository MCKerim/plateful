import { useEffect, useRef } from "react";
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { PurchasesCallbackId } from "@revenuecat/purchases-capacitor";
import { useAppDispatch } from "@/redux/hooks";
import { setCustomerInfo } from "@/redux/slices/subscriptionSlice";
import {
  initializeRevenueCat,
  getCustomerInfo,
  isNativePlatform,
} from "@/lib/revenuecat";

export function RevenueCatProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const listenerIdRef = useRef<PurchasesCallbackId | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!isNativePlatform()) {
        dispatch(setCustomerInfo(null));
        return;
      }

      try {
        await initializeRevenueCat();

        const customerInfo = await getCustomerInfo();
        dispatch(setCustomerInfo(customerInfo));

        const listenerId =
          await Purchases.addCustomerInfoUpdateListener((info) => {
            dispatch(setCustomerInfo(info));
          });
        listenerIdRef.current = listenerId;
      } catch (error) {
        console.error("RevenueCat: initialization failed", error);
        dispatch(setCustomerInfo(null));
      }
    };

    initialize();

    return () => {
      if (isNativePlatform() && listenerIdRef.current) {
        Purchases.removeCustomerInfoUpdateListener({
          listenerToRemove: listenerIdRef.current,
        }).catch(console.error);
      }
    };
  }, [dispatch]);

  return <>{children}</>;
}
