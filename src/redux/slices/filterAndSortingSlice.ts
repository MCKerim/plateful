import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface FilterAndSortingState {
  categoryId: number | null;
  sorting: string;
  searchTerm: string;
}

const initialState: FilterAndSortingState = {
  categoryId: null,
  sorting: "newest",
  searchTerm: "",
};

export const filterAndSortingSlice = createSlice({
  name: "filterAndSorting",
  initialState,

  reducers: {
    resetFilter: (state) => {
      state.categoryId = initialState.categoryId;
      state.searchTerm = initialState.searchTerm;
    },
    setCategoryId: (state, action: PayloadAction<number | null>) => {
      state.categoryId = action.payload;
    },
    setSorting: (state, action: PayloadAction<string>) => {
      state.sorting = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    }
  },
});

export const { resetFilter, setCategoryId, setSorting, setSearchTerm } =
  filterAndSortingSlice.actions;

export default filterAndSortingSlice.reducer;

export const selectCategoryId = (state: RootState) =>
  state.filterAndSorting.categoryId;

export const selectActiveFilterCount = (state: RootState) =>
  state.filterAndSorting.categoryId === null ? 0 : 1;

export const selectSorting = (state: RootState) =>
  state.filterAndSorting.sorting;

export const selectSearchTerm = (state: RootState) =>
  state.filterAndSorting.searchTerm;
