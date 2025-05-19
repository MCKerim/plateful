import type { PayloadAction } from "@reduxjs/toolkit"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { RootState } from "./store"

export interface UserState {
  value: number
  status: 'idle' | 'loading' | 'failed'
}

const initialState: UserState = {
  value: 0,
  status: 'idle'
}

export const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    increment: state => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1
    },
    decrement: state => {
      state.value -= 1
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    }
  }
})

// Export the generated action creators for use in components
export const { increment, decrement, incrementByAmount } = userSlice.actions

// Export the slice reducer for use in the store configuration
export default userSlice.reducer

// Selector functions allows us to select a value from the Redux root state.
// Selectors can also be defined inline in the `useSelector` call
// in a component, or inside the `createSlice.selectors` field.
export const selectCount = (state: RootState) => state.user.value
export const selectStatus = (state: RootState) => state.user.status
