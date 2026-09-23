import { describe, expect, it } from "vitest";
import reducer, {
  addKnownRecipeId,
  addMessage,
  addPendingFeedback,
  addToProposalCounter,
  clearPendingFeedback,
  resetChat,
  setPreviousResponseId,
} from "./chatbotSlice";

const RECIPE_ID = "f8259c81-c46b-41c5-83cf-fa4b7c2fd9e5";

function conversationWithSavedRecipe() {
  return [
    addMessage({ role: "user", content: "Gib mir ein Rezept für Bananenbrot" }),
    setPreviousResponseId("resp_1"),
    addToProposalCounter(1),
    addKnownRecipeId(RECIPE_ID),
    addPendingFeedback(`Proposal p_1 accepted. Saved as new recipe (id: ${RECIPE_ID}, title: "Bananenbrot").`),
  ].reduce(reducer, reducer(undefined, { type: "init" }));
}

describe("chatbotSlice", () => {
  it("keeps the conversation's memory next to its messages", () => {
    const state = conversationWithSavedRecipe();

    // Leaving /chatbot and coming back only remounts the page; the store keeps
    // all of this, so a later edit of the saved recipe is still accepted.
    expect(state.knownRecipeIds).toEqual([RECIPE_ID]);
    expect(state.pendingFeedback).toHaveLength(1);
    expect(state.proposalCounter).toBe(1);
  });

  it("does not list a recipe id twice", () => {
    const state = reducer(conversationWithSavedRecipe(), addKnownRecipeId(RECIPE_ID));

    expect(state.knownRecipeIds).toEqual([RECIPE_ID]);
  });

  it("clears sent outcomes but keeps the known ids", () => {
    const state = reducer(conversationWithSavedRecipe(), clearPendingFeedback());

    expect(state.pendingFeedback).toEqual([]);
    expect(state.knownRecipeIds).toEqual([RECIPE_ID]);
  });

  it("forgets everything together on reset", () => {
    const state = reducer(conversationWithSavedRecipe(), resetChat());

    expect(state).toEqual(reducer(undefined, { type: "init" }));
  });
});
