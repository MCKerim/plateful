import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface ServingsState {
  byRecipeId: Record<string, number>;
}

const initialState: ServingsState = {
  byRecipeId: {},
};

export const servingsSlice = createSlice({
  name: "servings",
  initialState,

  reducers: {
    setTargetServings: (
      state,
      action: PayloadAction<{ recipeId: string; servings: number }>
    ) => {
      state.byRecipeId[action.payload.recipeId] = action.payload.servings;
    },
    clearTargetServings: (state, action: PayloadAction<string>) => {
      delete state.byRecipeId[action.payload];
    },
  },
});

export const { setTargetServings, clearTargetServings } =
  servingsSlice.actions;

export default servingsSlice.reducer;

export const selectTargetServings = (recipeId: string) => (state: RootState) =>
  state.servings.byRecipeId[recipeId] as number | undefined;
