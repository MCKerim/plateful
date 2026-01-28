import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolOutputsForUI?: any;
  previous_response_id?: string;
}

interface ChatbotState {
  messages: ChatMessage[];
  previous_response_id: string | null;
  isTyping: boolean;
}

const initialState: ChatbotState = {
  messages: [],
  previous_response_id: null,
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
    setPreviousResponseId: (state, action: PayloadAction<string>) => {
      state.previous_response_id = action.payload;
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    resetChat: (state) => {
      state.messages = [];
      state.previous_response_id = null;
      state.isTyping = false;
    },
    appendToLastMessage: (state, action: PayloadAction<string>) => {
      const last = state.messages[state.messages.length - 1];
      if (last) {
        last.content += action.payload;
      }
    },
    finalizeLastMessage: (state, action: PayloadAction<any[]>) => {
      const last = state.messages[state.messages.length - 1];
      if (last && action.payload.length > 0) {
        last.toolOutputsForUI = action.payload;
      }
    },
  },
});

export const {
  addMessage,
  addMessages,
  setPreviousResponseId,
  setIsTyping,
  resetChat,
  appendToLastMessage,
  finalizeLastMessage,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;

export const selectMessages = (state: RootState) => state.chatbot.messages;
export const selectIsTyping = (state: RootState) => state.chatbot.isTyping;
export const selectVisibleMessages = (state: RootState) =>
  state.chatbot.messages.filter((message: ChatMessage) => message.role !== "tool");
export const selectPreviousResponseId = (state: RootState) => state.chatbot.previous_response_id;
