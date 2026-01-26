import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface MealPlannerState {
  // Store as ISO string for Redux serialization
  currentWeek: string;
}

const initialState: MealPlannerState = {
  currentWeek: new Date().toISOString(),
};

export const mealPlannerSlice = createSlice({
  name: "mealPlanner",
  initialState,

  reducers: {
    setCurrentWeek: (state, action: PayloadAction<string>) => {
      state.currentWeek = action.payload;
    },
    resetToCurrentWeek: (state) => {
      state.currentWeek = new Date().toISOString();
    },
  },
});

export const { setCurrentWeek, resetToCurrentWeek } = mealPlannerSlice.actions;

export default mealPlannerSlice.reducer;

export const selectCurrentWeek = (state: RootState) => new Date(state.mealPlanner.currentWeek);
