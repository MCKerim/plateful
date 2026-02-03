import { useState, useRef, useEffect } from "react";
import { RotateCcw, ImagePlus, X, ArrowUp } from "lucide-react";
import Layout from "../components/layout/Layout";
import MarkdownRenderer from "../components/general/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectHouseholdId } from "@/redux/slices/householdSlice";
import {
  selectMessages,
  selectIsTyping,
  selectVisibleMessages,
  addMessage,
  setIsTyping,
  resetChat,
  ChatMessage,
  ToolOutputForUI,
  setPreviousResponseId,
  selectPreviousResponseId,
  appendToLastMessage,
  finalizeLastMessage,
  setRecipeId,
} from "@/redux/slices/chatbotSlice";
import { useNavigate, useSearchParams } from "react-router";
import Rive from "@rive-app/react-canvas";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/utils/supabase";
import { useImageSourcePicker } from "@/hooks/general/useImageSourcePicker";
import {
  getCategoryIdByTranslatedEnglishName,
  getEnglishCategoryNameById,
} from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { useCreateRecipe } from "@/hooks/recipe/useCreateRecipe";
import { Field } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useUpdateRecipe } from "@/hooks/recipe/useUpdateRecipe";
import { toast } from "sonner";
import { RecipeProposalDialog } from "@/components/chatbot/RecipeProposalDialog";
import { DEFAULT_CATEGORY_ID } from "@/lib/constants";

type VisionPart = { type: "input_text"; text: string } | { type: "input_image"; image_url: string };

export default function Chatbot() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const householdId = useAppSelector(selectHouseholdId);
  const createRecipe = useCreateRecipe();
  const [searchParams, setSearchParams] = useSearchParams();

  const messages = useAppSelector(selectMessages);
  const previousResponseId = useAppSelector(selectPreviousResponseId);
  const isTyping = useAppSelector(selectIsTyping);
  const visibleMessages = useAppSelector(selectVisibleMessages);

  // Get recipe context from URL param
  const recipeIdParam = searchParams.get("recipeId");
  const recipeId = recipeIdParam ? Number.parseInt(recipeIdParam) : null;
  const { data: recipeContext } = useRecipe(recipeId);

  const updateRecipeMutation = useUpdateRecipe();

  const [inputValue, setInputValue] = useState("");
  const [selectedImagesAsbase64, setSelectedImagesAsbase64] = useState<string[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<string[]>([]);
  const [knownRecipeIds, setKnownRecipeIds] = useState<number[]>(
    () => (recipeId ? [recipeId] : [])
  );

  const proposalCounterRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { pickImage, ImageSourceDrawerComponent } = useImageSourcePicker({
    resultType: "base64",
  });

  const handlePickImagesClick = async () => {
    const result = await pickImage();

    if (!result?.base64String) {
      return;
    }

    setSelectedImagesAsbase64((prev) => [...prev, result.base64String]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImagesAsbase64((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedImagesAsbase64.length === 0) return;

    // Check if this is the first message with recipe context
    const isFirstMessageWithContext = messages.length === 0 && recipeContext;

    // Show the user message in the UI right away
    const userMessage: ChatMessage & {
      images?: string[];
      recipeName?: string;
    } = {
      role: "user",
      content: inputValue.trim(),
      images: selectedImagesAsbase64,
      ...(isFirstMessageWithContext && { recipeName: recipeContext.name }),
    };

    dispatch(addMessage(userMessage));
    setInputValue("");
    setSelectedImagesAsbase64([]);
    // Clear recipe context from URL after first message (like images)
    if (isFirstMessageWithContext) {
      setSearchParams({}, { replace: true });
      dispatch(setRecipeId(recipeId));
    }
    dispatch(setIsTyping(true));

    try {
      // Build the text content - prepend context if this is first message and we have context
      let textContent = inputValue.trim();
      if (isFirstMessageWithContext) {
        const categoryName = getEnglishCategoryNameById(recipeContext.category);
        const contextPrefix = `[Recipe Context]
recipeId: ${recipeContext.id}
title: ${recipeContext.name}
category: ${categoryName}
description: ${recipeContext.description ?? "No description"}
[End Recipe Context]

`;
        textContent = contextPrefix + textContent;
      }

      // Prepend pending feedback if any
      if (pendingFeedback.length > 0) {
        const feedbackBlock = `[Proposal Outcomes]\n${pendingFeedback.join("\n")}\n[End Proposal Outcomes]\n\n`;
        textContent = feedbackBlock + textContent;
        setPendingFeedback([]);
      }

      // Build vision content parts for the server
      const parts: VisionPart[] = [];
      if (textContent) {
        parts.push({ type: "input_text", text: textContent });
      }
      for (const url of userMessage.images || []) {
        parts.push({
          type: "input_image",
          image_url: `data:image/jpeg;base64,${url}`,
        });
      }

      // Call the edge function with streaming
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          previous_response_id: previousResponseId,
          known_recipe_ids: knownRecipeIds,
          proposal_counter: proposalCounterRef.current,
          messages: [
            {
              role: "user",
              content: parts,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr.trim()) continue;

          try {
            const event = JSON.parse(jsonStr);
            if (event.done) {
              if (!assistantMessageAdded) {
                dispatch(addMessage({ role: "assistant", content: "" }));
              }
              dispatch(setPreviousResponseId(event.id));
              const toolOutputs = JSON.parse(event.tool_outputs_for_ui);
              proposalCounterRef.current += toolOutputs.length;
              dispatch(finalizeLastMessage(toolOutputs));
            } else if (event.delta) {
              if (!assistantMessageAdded) {
                dispatch(setIsTyping(false));
                dispatch(addMessage({ role: "assistant", content: event.delta }));
                assistantMessageAdded = true;
              } else {
                dispatch(appendToLastMessage(event.delta));
              }
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (error) {
      console.error("Error calling chatbot function:", error);

      dispatch(addMessage({ role: "assistant", content: t("chatbot.errorMessage") }));
    } finally {
      dispatch(setIsTyping(false));
    }
  };

  const handleResetChat = () => {
    dispatch(resetChat());
    setPendingFeedback([]);
    setKnownRecipeIds(recipeId ? [recipeId] : []);
  };

  function handleMessageSuggestionButton(suggestion: string) {
    setInputValue(suggestion);
  }

  async function saveSuggestedRecipe(
    proposalId: string,
    title: string,
    description: string,
    category: string
  ) {
    let categoryId = getCategoryIdByTranslatedEnglishName(category);

    if (categoryId === null) {
      console.error("Invalid category:", category);
      categoryId = DEFAULT_CATEGORY_ID;
    }

    if (!householdId) {
      toast.error(t("chatbot.saveRecipeError"));
      return;
    }

    try {
      const newRecipe = await createRecipe.mutateAsync({
        name: title,
        description,
        link: "",
        householdId,
        category: categoryId,
      });
      setKnownRecipeIds((prev) => [...prev, newRecipe.id]);
      setPendingFeedback((prev) => [
        ...prev,
        `Proposal ${proposalId} accepted. Saved as new recipe (id: ${newRecipe.id}, title: "${title}").`,
      ]);
      toast.success(t("chatbot.recipeSaved"), {
        action: {
          label: t("common.open"),
          onClick: () => navigate(`/recipe/${newRecipe.id}`),
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(t("chatbot.saveRecipeError"));
    }
  }

  async function saveEditedRecipe(
    proposalId: string,
    recipeId: number,
    title: string,
    description: string,
    category: string,
    link: string
  ) {
    let categoryId = getCategoryIdByTranslatedEnglishName(category);

    if (categoryId === null) {
      console.error("Invalid category:", category);
      categoryId = DEFAULT_CATEGORY_ID;
    }

    try {
      await updateRecipeMutation.mutateAsync({
        recipeId,
        name: title,
        description,
        link,
        category: categoryId,
      });
      setPendingFeedback((prev) => [
        ...prev,
        `Proposal ${proposalId} accepted. Recipe ${recipeId} ("${title}") updated.`,
      ]);
      toast.success(t("chatbot.recipeUpdated"), {
        action: {
          label: t("common.open"),
          onClick: () => navigate(`/recipe/${recipeId}`),
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(t("chatbot.updateRecipeError"));
    }
  }

  return (
    <Layout
      headerButtons={
        <Button
          onClick={handleResetChat}
          variant="ghost"
          size="icon"
          aria-label={t("common.reset")}
          title={t("common.reset")}
        >
          <RotateCcw />
        </Button>
      }
    >
      {/* Chat BG */}
      {visibleMessages.length === 0 && (
        <div className="absolute flex-col items-center justify-center w-full gap-2 -translate-x-1/2 left-1/2">
          <div className="w-full h-[200px] mx-auto">
            <Rive src="/plateful-character.riv" artboard="Fly-In" />
          </div>

          <div className="flex items-center justify-center w-full gap-2 mb-6">
            <h2 className="first-font text-xl font-bold">{t("chatbot.greeting")}</h2>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              className="rounded-full"
              variant="secondary"
              size="sm"
              onClick={() =>
                handleMessageSuggestionButton(t("chatbot.suggestions.suggestion1.text"))
              }
            >
              {t("chatbot.suggestions.suggestion1.label")}
            </Button>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                className="rounded-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleMessageSuggestionButton(t("chatbot.suggestions.suggestion2.text"))
                }
              >
                {t("chatbot.suggestions.suggestion2.label")}
              </Button>

              <Button
                className="rounded-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleMessageSuggestionButton(t("chatbot.suggestions.suggestion3.text"))
                }
              >
                {t("chatbot.suggestions.suggestion3.label")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-60">
        {visibleMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-start gap-2 ${
                message.role === "user" ? "flex-row-reverse max-w-[80%]" : "flex-row w-full"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-lg max-w-full px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.role === "user" && (
                  <>
                    {/* Recipe context chip if present */}
                    {"recipeName" in message &&
                      (message as ChatMessage & { recipeName?: string }).recipeName && (
                      <div className="text-background border border-dashed border-background text-center py-[0.5px] px-4 font-medium second-font rounded mb-2">
                        {(message as ChatMessage & { recipeName?: string }).recipeName}
                      </div>
                    )}

                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* optional images if present */}
                    {"images" in message &&
                      Array.isArray((message as ChatMessage & { images?: string[] }).images) &&
                      ((message as ChatMessage & { images?: string[] }).images ?? []).length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {((message as ChatMessage & { images?: string[] }).images ?? []).map((src: string, i: number) => (
                            <img
                              key={i}
                              src={`data:image/jpeg;base64,${src}`}
                              srcSet={`data:image/jpeg;base64,${src}`}
                              alt={`upload-${i}`}
                              className="rounded-md border w-16 h-16 object-cover"
                            />
                          ))}
                        </div>
                      )}
                  </>
                )}

                {message.role === "assistant" && (
                  <MarkdownRenderer content={message.content} className="text-sm" />
                )}

                {message.role === "assistant" &&
                  message.toolOutputsForUI &&
                  message.toolOutputsForUI.length > 0 &&
                  message.toolOutputsForUI.map((toolOutput: ToolOutputForUI, i: number) => (
                    <RecipeProposalDialog
                      key={toolOutput.proposalId ?? i}
                      toolOutput={toolOutput}
                      onSaveNew={saveSuggestedRecipe}
                      onSaveEdit={saveEditedRecipe}
                      t={t}
                    />
                  ))}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[80%]">
              <div className="px-4 py-2 rounded-lg bg-muted">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div className="w-2 h-2 delay-100 rounded-full bg-muted-foreground animate-bounce"></div>
                  <div className="w-2 h-2 delay-200 rounded-full bg-muted-foreground animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`w-full max-w-lg fixed z-10 pr-8 bottom-20`}>
        {/* Recipe context and image previews before sending */}
        {(recipeContext || selectedImagesAsbase64.length > 0) && (
          <div className="flex gap-2 flex-wrap mb-2 items-center">
            {/* Recipe context chip */}
            {recipeContext && (
              <div className="bg-accent text-accent-foreground second-font font-semibold rounded-md px-3 py-2 text-sm flex items-center gap-2 max-w-[200px]">
                <span className="truncate">{recipeContext.name}</span>
              </div>
            )}

            {/* Image previews */}
            {selectedImagesAsbase64.map((imageAsBase64, i) => (
              <button
                key={i}
                className="relative"
                onClick={() => handleRemoveImage(i)}
                aria-label={t("common.remove")}
                title={t("common.remove")}
              >
                <img
                  src={`data:image/jpeg;base64,${imageAsBase64}`}
                  srcSet={`data:image/jpeg;base64,${imageAsBase64}`}
                  loading="lazy"
                  alt={`preview-${i}`}
                  className="rounded-md border w-12 h-12 object-cover"
                />

                <div className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-black/70 text-white border border-white">
                  <X className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        )}

        <Field>
          <InputGroup className="rounded-2xl bg-background dark:bg-background">
            <InputGroupTextarea
              placeholder={t("chatbot.inputPlaceholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              maxLength={3000}
              maxHeight={200}
              rows={1}
              enterKeyHint="enter"
            />

            <InputGroupAddon align="block-end" className="px-2 pb-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handlePickImagesClick}
                title={t("common.uploadImage")}
                className="rounded-full"
              >
                <ImagePlus />
              </Button>

              <Button
                type="button"
                variant="accent"
                size="icon"
                onClick={handleSendMessage}
                disabled={isTyping}
                title={t("common.send")}
                className="ml-auto rounded-full"
              >
                <ArrowUp className="!size-5" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </div>

      {ImageSourceDrawerComponent}
    </Layout>
  );
}
