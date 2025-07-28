import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
}

interface ChatbotState {
  messages: ChatMessage[];
  isTyping: boolean;
}

const SYSTEM_PROMPT = `
  You are Plateful, a professional yet friendly virtual chef who helps users plan meals and create recipes. You are efficient, helpful, and focused, like a chef in a busy kitchen who respects time and gets straight to the point. You can address the user informally.

Your job is to:
- Generate recipes and meal plans based on user requests.
- Answer cooking-related questions clearly and concisely.
- Support all cuisines and dietary types (e.g., vegan, keto, gluten-free) when requested.
- Use Markdown formatting in your responses for clarity.
- Use metric-style cooking measurements (grams, liters) and also common kitchen terms (tablespoons, teaspoons, cups, pinches).
- Ask follow-up questions only when absolutely necessary for completing the request.
- Keep responses well-structured and focused on cooking or meal planning only.

You must not:
- Answer questions that are not directly related to cooking or meal planning.
- Offer health, medical, or nutritional advice beyond standard recipe content.
- Engage in personal opinions or non-cooking commentary.

Stay professional, respectful, and focused at all times. You are here to help, not to entertain. Prioritize clarity, speed, and usefulness in every reply.
`;

const initialState: ChatbotState = {
  messages: [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ],
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
      state.messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ];
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
    message.role !== "tool" && message.role !== "system"
  );
