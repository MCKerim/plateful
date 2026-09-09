import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { User } from "@/types/exportedDatabaseTypes.types";
import { deviceWeekStart } from "@/lib/weekStart";

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
    /** The account's first weekday alone, so a seed landing late or a picker change cannot clobber a fresher profile. */
    setUserWeekStart: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.week_start = action.payload;
      }
    },
  },
});

export const { setUser, setUserWeekStart } = userSlice.actions;

export default userSlice.reducer;

export const selectUser = (state: RootState) => state.user.user;

/**
 * The planner's first weekday (0 = Sunday): the account's own, or the device's
 * for the moment before the profile has been seeded, which is also what the
 * seed writes, so nothing regroups when it lands.
 */
export const selectWeekStart = (state: RootState) =>
  state.user.user?.week_start ?? deviceWeekStart();
