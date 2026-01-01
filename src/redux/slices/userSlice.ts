import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { User } from "@/types/exportedDatabaseTypes.types";

interface UserState {
  user: User | null;
}
const initialState: UserState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,

  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;

export const selectUser = (state: RootState) => state.user.user;
export const selectUserLanguage = (state: RootState) => state.user.user?.language || localStorage.getItem('language');
