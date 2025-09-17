import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface FilterAndSortingState {
  categoryId: number;
}

const initialState: FilterAndSortingState = {
  categoryId: 0,
};

export const filterAndSortingSlice = createSlice({
  name: "filterAndSorting",
  initialState,

  reducers: {
    resetFilter: (state) => {
      state.categoryId = initialState.categoryId;
    },
    setCategoryId: (state, action: PayloadAction<number>) => {
      state.categoryId = action.payload;
    },
  },
});

export const { resetFilter, setCategoryId } = filterAndSortingSlice.actions;

export default filterAndSortingSlice.reducer;

export const selectCategoryId = (state: RootState) =>
  state.filterAndSorting.categoryId;
