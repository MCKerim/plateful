import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Household } from "@/types/exportedDatabaseTypes.types";

interface HouseholdState {
  household: Household | null;
}
const initialState: HouseholdState = {
  household: null,
};

export const householdSlice = createSlice({
  name: "household",
  initialState,

  reducers: {
    setHousehold: (state, action: PayloadAction<Household | null>) => {
      state.household = action.payload;
    },
  },
});

export const { setHousehold } = householdSlice.actions;

export default householdSlice.reducer;

export const selectHousehold = (state: RootState) => state.household.household;
