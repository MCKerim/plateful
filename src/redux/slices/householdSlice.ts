import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Household } from "@/types/exportedDatabaseTypes.types";
import { HouseholdMember } from "@/api/user.api";

interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[] | null;
}
const initialState: HouseholdState = {
  household: null,
  members: null,
};

export const householdSlice = createSlice({
  name: "household",
  initialState,

  reducers: {
    setHousehold: (state, action: PayloadAction<Household | null>) => {
      state.household = action.payload;
    },
    setHouseholdMembers: (
      state,
      action: PayloadAction<HouseholdMember[] | null>
    ) => {
      state.members = action.payload;
    },
  },
});

export const { setHousehold, setHouseholdMembers } = householdSlice.actions;

export default householdSlice.reducer;

export const selectHousehold = (state: RootState) => state.household.household;
export const selectHouseholdMembers = (state: RootState) => state.household.members;
export const selectHouseholdId = (state: RootState) => state.household.household?.id ?? null;
export const selectIsCurrentUserOwner = (state: RootState) => {
  const household = state.household.household;
  const userId = state.user.user?.id;
  return !!(household && userId && household.owner_id === userId);
};
