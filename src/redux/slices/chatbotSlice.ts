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
  category: string;
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
    category?: string;
  };
  status: "pending" | "saved" | "dismissed";
  savedRecipeId?: string;
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
  pendingFeedback: string[];
  activeProposal: ToolOutputForUI | null;
}

const initialState: ChatbotState = {
  messages: [],
  previous_response_id: null,
  isTyping: false,
  recipeId: null,
  pendingFeedback: [],
  activeProposal: null,
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
      state.pendingFeedback = [];
      state.activeProposal = null;
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
        const withStatus = action.payload.map((o) => ({ ...o, status: "pending" as const }));
        last.toolOutputsForUI = withStatus;
        state.activeProposal = withStatus[0];
      }
    },
    addPendingFeedback: (state, action: PayloadAction<string>) => {
      state.pendingFeedback.push(action.payload);
    },
    clearPendingFeedback: (state) => {
      state.pendingFeedback = [];
    },
    updateProposalStatus: (
      state,
      action: PayloadAction<{ proposalId: string; status: "saved" | "dismissed"; savedRecipeId?: string }>
    ) => {
      const { proposalId, status, savedRecipeId } = action.payload;
      for (const message of state.messages) {
        if (message.toolOutputsForUI) {
          for (const output of message.toolOutputsForUI) {
            if (output.proposalId === proposalId) {
              output.status = status;
              if (savedRecipeId) output.savedRecipeId = savedRecipeId;
            }
          }
        }
      }
      if (state.activeProposal?.proposalId === proposalId) {
        state.activeProposal = null;
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
  addPendingFeedback,
  clearPendingFeedback,
  updateProposalStatus,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;

export const selectMessages = (state: RootState) => state.chatbot.messages;
export const selectIsTyping = (state: RootState) => state.chatbot.isTyping;
export const selectVisibleMessages = (state: RootState) =>
  state.chatbot.messages.filter((message: ChatMessage) => message.role !== "tool");
export const selectPreviousResponseId = (state: RootState) => state.chatbot.previous_response_id;
export const selectRecipeId = (state: RootState) => state.chatbot.recipeId;
export const selectPendingFeedback = (state: RootState) => state.chatbot.pendingFeedback;
export const selectActiveProposal = (state: RootState) => state.chatbot.activeProposal;
