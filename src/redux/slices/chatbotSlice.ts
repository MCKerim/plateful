import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface ChatbotIngredient {
  item: string;
  section: string | null;
}

export type NewRecipeProposal = {
  proposalId: string;
  title: string;
  description: string;
  servings: number | undefined;
  ingredients: ChatbotIngredient[] | undefined;
  instructions: string;
  collectionIds?: string[];
};

export type EditRecipeProposal = NewRecipeProposal & {
  recipeId: string;
  link: string;
};

export interface ToolOutputForUI {
  proposalId: string;
  toolName: string;
  args: {
    recipeId?: string;
    title?: string;
    description?: string;
    servings?: number;
    ingredients?: ChatbotIngredient[];
    instructions?: string;
    collectionIds?: string[];
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolOutputsForUI?: ToolOutputForUI[];
  previous_response_id?: string;
}

interface ChatbotState {
  messages: ChatMessage[];
  previous_response_id: string | null;
  isTyping: boolean;
  recipeId: string | null;
}

const initialState: ChatbotState = {
  messages: [],
  previous_response_id: null,
  isTyping: false,
  recipeId: null,
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
    setRecipeId: (state, action: PayloadAction<string | null>) => {
      state.recipeId = action.payload;
    },
    resetChat: (state) => {
      state.messages = [];
      state.previous_response_id = null;
      state.isTyping = false;
      state.recipeId = null;
    },
    appendToLastMessage: (state, action: PayloadAction<string>) => {
      const last = state.messages[state.messages.length - 1];
      if (last) {
        last.content += action.payload;
      }
    },
    finalizeLastMessage: (state, action: PayloadAction<ToolOutputForUI[]>) => {
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
  setRecipeId,
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
export const selectRecipeId = (state: RootState) => state.chatbot.recipeId;
