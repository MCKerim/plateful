import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo } from "@revenuecat/purchases-capacitor";
import { REVENUECAT_API_KEY } from "@/types/subscription.types";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initializeRevenueCat(): Promise<void> {
  if (!isNativePlatform()) return;

  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const { customerInfo } = await Purchases.logIn({ appUserID: userId });
  return customerInfo;
}

export async function logoutUser(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const { customerInfo } = await Purchases.logOut();
  return customerInfo;
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const { customerInfo } = await Purchases.getCustomerInfo();
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) return null;

  const { customerInfo } = await Purchases.restorePurchases();
  return customerInfo;
}
