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

// Everything the conversation's memory depends on lives here, next to the
// messages and previous_response_id — never in Chatbot.tsx component state.
// The page remounts on every navigation while the conversation survives; local
// state reset the saved-recipe ids and dropped unsent save outcomes, so the
// model's correct edit was rejected by the edge function and came back as a
// new recipe (duplicates on save). scripts/chatbot-model-eval.ts reproduced it.
interface ChatbotState {
  messages: ChatMessage[];
  previous_response_id: string | null;
  isTyping: boolean;
  recipeId: string | null;
  /** Saved recipe ids the model may edit — the edge function rejects any other. */
  knownRecipeIds: string[];
  /** [Proposal Outcomes] lines waiting to be prepended to the next message. */
  pendingFeedback: string[];
  /** Proposals shown so far; the edge function numbers new ones p_<n+1>. */
  proposalCounter: number;
}

const initialState: ChatbotState = {
  messages: [],
  previous_response_id: null,
  isTyping: false,
  recipeId: null,
  knownRecipeIds: [],
  pendingFeedback: [],
  proposalCounter: 0,
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
    addKnownRecipeId: (state, action: PayloadAction<string>) => {
      if (!state.knownRecipeIds.includes(action.payload)) {
        state.knownRecipeIds.push(action.payload);
      }
    },
    addPendingFeedback: (state, action: PayloadAction<string>) => {
      state.pendingFeedback.push(action.payload);
    },
    clearPendingFeedback: (state) => {
      state.pendingFeedback = [];
    },
    addToProposalCounter: (state, action: PayloadAction<number>) => {
      state.proposalCounter += action.payload;
    },
    resetChat: () => initialState,
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
  addKnownRecipeId,
  addPendingFeedback,
  clearPendingFeedback,
  addToProposalCounter,
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
export const selectKnownRecipeIds = (state: RootState) => state.chatbot.knownRecipeIds;
export const selectPendingFeedback = (state: RootState) => state.chatbot.pendingFeedback;
export const selectProposalCounter = (state: RootState) => state.chatbot.proposalCounter;
