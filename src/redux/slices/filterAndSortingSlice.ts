import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface FilterAndSortingState {
  categoryId: number;
  sorting: string;
}

const initialState: FilterAndSortingState = {
  categoryId: 0,
  sorting: "newest",
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
    setSorting: (state, action: PayloadAction<string>) => {
      state.sorting = action.payload;
    },
  },
});

export const { resetFilter, setCategoryId, setSorting } =
  filterAndSortingSlice.actions;

export default filterAndSortingSlice.reducer;

export const selectCategoryId = (state: RootState) =>
  state.filterAndSorting.categoryId;

export const selectActiveFilterCount = (state: RootState) =>
  state.filterAndSorting.categoryId === 0 ? 0 : 1;

export const selectSorting = (state: RootState) =>
  state.filterAndSorting.sorting;
