import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolOutputsForUI?: any;
  previous_response_id?: string;
}

export interface RecipeContext {
  id: number;
  name: string;
  description: string | null;
}

interface ChatbotState {
  messages: ChatMessage[];
  previous_response_id: string | null;
  isTyping: boolean;
  recipeContext: RecipeContext | null;
}

const initialState: ChatbotState = {
  messages: [],
  previous_response_id: null,
  isTyping: false,
  recipeContext: null,
};

export const chatbotSlice = createSlice({
  name: "chatbot",
  initialState,

  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    addMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages.push(...action.payload);
    },
    setPreviousResponseId: (state, action: PayloadAction<string>) => {
      state.previous_response_id = action.payload;
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    setRecipeContext: (state, action: PayloadAction<RecipeContext | null>) => {
      state.recipeContext = action.payload;
    },
    resetChat: (state) => {
      state.messages = [];
      state.previous_response_id = null;
      state.isTyping = false;
      state.recipeContext = null;
    },
  },
});

export const { addMessage, addMessages, setPreviousResponseId, setIsTyping, setRecipeContext, resetChat } = chatbotSlice.actions;

export default chatbotSlice.reducer;

export const selectMessages = (state: RootState) => state.chatbot.messages;
export const selectIsTyping = (state: RootState) => state.chatbot.isTyping;
export const selectVisibleMessages = (state: RootState) => 
  state.chatbot.messages.filter((message: ChatMessage) => 
    message.role !== "tool"
  );
export const selectPreviousResponseId = (state: RootState) => state.chatbot.previous_response_id;
export const selectRecipeContext = (state: RootState) => state.chatbot.recipeContext;