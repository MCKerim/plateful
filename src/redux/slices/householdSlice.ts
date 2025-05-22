import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Household } from "@/types/exportedDatabaseTypes.types";

interface HouseholdState {
  household: Household | null;
  members: { id: string, email: string }[] | null;
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
    setHouseholdMembers: (state, action: PayloadAction<{ id: string, email: string }[] | null>) => {
      state.members = action.payload;
    },
  },
});

export const { setHousehold, setHouseholdMembers } = householdSlice.actions;

export default householdSlice.reducer;

export const selectHousehold = (state: RootState) => state.household.household;
export const selectHouseholdMembers = (state: RootState) => state.household.members;
