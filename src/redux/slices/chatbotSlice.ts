import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  previous_response_id?: string;
}

interface ChatbotState {
  messages: ChatMessage[];
  isTyping: boolean;
}

const initialState: ChatbotState = {
  messages: [],
  isTyping: false,
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
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetChat: (state) => {
      state.messages = [];
      state.isTyping = false;
    },
  },
});

export const { addMessage, addMessages, setIsTyping, resetChat } = chatbotSlice.actions;

export default chatbotSlice.reducer;

export const selectMessages = (state: RootState) => state.chatbot.messages;
export const selectIsTyping = (state: RootState) => state.chatbot.isTyping;
export const selectVisibleMessages = (state: RootState) => 
  state.chatbot.messages.filter((message: ChatMessage) => 
    message.role !== "tool"
  );
