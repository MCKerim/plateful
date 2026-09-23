# Chatbot: conversation memory lives in Redux, never in page state

**Symptom (reported 2026-09):** asking the chef to change a saved recipe produced a *new* recipe proposal; saving it created a duplicate. Kerim's girlfriend ended up with many of them.

**Cause:** the model was not at fault — `scripts/chatbot-model-eval.ts` scored Terra, Sol and Luna 6 at 39/39 on edit-vs-new. The bug was in `src/page/Chatbot.tsx`: `knownRecipeIds`, `pendingFeedback` (the unsent `[Proposal Outcomes]` lines) and the proposal counter were `useState`/`useRef`, while `messages` and `previous_response_id` live in `chatbotSlice`. Every navigation remounts the page, so the conversation survived but its memory did not:

- **Resume from a recipe** (`Recipe.tsx` `handleAskChatbot` → `/chatbot` without `?recipeId`): `knownRecipeIds` came back empty. The model correctly called `propose_recipe_edit`, the edge function rejected the id ("Use propose_recipe instead"), and the model proposed a new recipe.
- **Save → toast "Open" → back → ask for a change:** the "saved as new recipe (id …)" outcome was never sent, so the model could only propose a new recipe.

A script variant that reset those values between turns reproduced a duplicate 12/12 on both Terra and Sol.

**Fix (2026-09-23):** the three values are `chatbotSlice` state (`knownRecipeIds`, `pendingFeedback`, `proposalCounter`), and `resetChat` returns the whole initial state, so they reset together with the conversation, never separately. `chatbotSlice.test.ts` pins that. **Keep:** anything the edge function's request depends on across turns belongs in the slice, not in the page.
