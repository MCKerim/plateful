import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export type CollectionSelection = string | "all" | null;

interface FilterAndSortingState {
  collectionSelection: CollectionSelection;
  sorting: string;
  searchTerm: string;
}

const initialState: FilterAndSortingState = {
  collectionSelection: null,
  sorting: "newest",
  searchTerm: "",
};

export const filterAndSortingSlice = createSlice({
  name: "filterAndSorting",
  initialState,

  reducers: {
    resetFilter: (state) => {
      state.collectionSelection = initialState.collectionSelection;
      state.searchTerm = initialState.searchTerm;
    },
    setCollectionSelection: (state, action: PayloadAction<CollectionSelection>) => {
      state.collectionSelection = action.payload;
    },
    setSorting: (state, action: PayloadAction<string>) => {
      state.sorting = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
  },
});

export const { resetFilter, setCollectionSelection, setSorting, setSearchTerm } =
  filterAndSortingSlice.actions;

export default filterAndSortingSlice.reducer;

export const selectCollectionSelection = (state: RootState) =>
  state.filterAndSorting.collectionSelection;

export const selectActiveFilterCount = (state: RootState) =>
  state.filterAndSorting.collectionSelection &&
  state.filterAndSorting.collectionSelection !== "all"
    ? 1
    : 0;

export const selectSorting = (state: RootState) => state.filterAndSorting.sorting;

export const selectSearchTerm = (state: RootState) => state.filterAndSorting.searchTerm;
