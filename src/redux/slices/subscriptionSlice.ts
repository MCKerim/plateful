import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { CustomerInfo } from "@revenuecat/purchases-capacitor";
import { ENTITLEMENT_ID } from "@/types/subscription.types";

interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
}

const initialState: SubscriptionState = {
  isPro: false,
  isLoading: true,
  customerInfo: null,
};

export const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setCustomerInfo: (state, action: PayloadAction<CustomerInfo | null>) => {
      state.customerInfo = action.payload;
      state.isPro =
        action.payload?.entitlements.active[ENTITLEMENT_ID] !== undefined;
      state.isLoading = false;
    },
    resetSubscription: () => {
      return { ...initialState, isLoading: false };
    },
  },
});

export const { setCustomerInfo, resetSubscription } =
  subscriptionSlice.actions;

export default subscriptionSlice.reducer;

export const selectIsPro = (state: RootState) => state.subscription.isPro;
export const selectSubscriptionLoading = (state: RootState) =>
  state.subscription.isLoading;
export const selectCustomerInfo = (state: RootState) =>
  state.subscription.customerInfo;
