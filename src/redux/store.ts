import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import householdReducer from "./slices/householdSlice";
import chatbotReducer from "./slices/chatbotSlice";
import filterAndSortingReducer from "./slices/filterAndSortingSlice";
import mealPlannerReducer from "./slices/mealPlannerSlice";
import servingsReducer from "./slices/servingsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    household: householdReducer,
    chatbot: chatbotReducer,
    filterAndSorting: filterAndSortingReducer,
    mealPlanner: mealPlannerReducer,
    servings: servingsReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;

export type AppDispatch = AppStore["dispatch"];

export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
