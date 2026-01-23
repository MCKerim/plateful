import { useState, useRef, useEffect } from "react";
import { RotateCcw, ImagePlus, X, Send } from "lucide-react";
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
  addMessages,
  setIsTyping,
  resetChat,
  ChatMessage,
  setPreviousResponseId,
  selectPreviousResponseId,
} from "@/redux/slices/chatbotSlice";
import { useNavigate, useSearchParams } from "react-router";
import Rive from "@rive-app/react-canvas";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/utils/supabase";
import {
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  getCategoryIdByTranslatedEnglishName,
  getEnglishCategoryNameById,
} from "@/lib/recipeCategoryHelper/recipeCategoryHelper";
import { useCreateRecipe } from "@/hooks/recipe/useCreateRecipe";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useRecipe } from "@/hooks/recipe/useRecipe";
import { useUpdateRecipe } from "@/hooks/recipe/useUpdateRecipe";

type VisionPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

// Component to handle recipe proposal dialogs with optional field merging
function RecipeProposalDialog({
  toolOutput,
  onSaveNew,
  onSaveEdit,
  t,
}: {
  toolOutput: any;
  onSaveNew: (title: string, description: string, category: string) => void;
  onSaveEdit: (
    recipeId: number,
    title: string,
    description: string,
    category: string,
  ) => void;
  t: any;
}) {
  const isEditProposal = toolOutput.toolName === "propose_recipe_edit";
  const editRecipeId = isEditProposal ? toolOutput.args.recipeId : null;

  // Fetch original recipe data for edit proposals to merge with partial updates
  const { data: originalRecipe } = useRecipe(editRecipeId);

  // For edit proposals, merge tool output with original recipe (tool output takes precedence)
  const getMergedValue = (field: "title" | "description" | "category") => {
    const toolValue =
      field === "title"
        ? toolOutput.args.title
        : field === "description"
        ? toolOutput.args.description
        : toolOutput.args.category;

    if (toolValue !== undefined && toolValue !== null) {
      return toolValue;
    }

    // Fall back to original recipe data for edit proposals
    if (isEditProposal && originalRecipe) {
      if (field === "title") return originalRecipe.name;
      if (field === "description") return originalRecipe.description ?? "";
      if (field === "category")
        return getEnglishCategoryNameById(originalRecipe.category);
    }

    return "";
  };

  const finalTitle = getMergedValue("title");
  const finalDescription = getMergedValue("description");
  const finalCategory = getMergedValue("category");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div>
          <p className="second-font font-medium mt-2 border-t border-dashed border-secondary-foreground pt-2 text-center">
            {finalTitle}
          </p>

          <Button variant="accent" size="sm" className="mt-2 w-full">
            <span className="truncate">
              {isEditProposal
                ? t("chatbot.previewEditedRecipe")
                : t("chatbot.previewRecipe")}
            </span>
          </Button>
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="second-font text-lg font-bold mt-2">
            {finalTitle}
          </DialogTitle>

          <DialogDescription className="text-sm font-medium text-muted-foreground">
            {finalCategory}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] rounded-md border p-2">
          <MarkdownRenderer
            content={finalDescription}
            className="font-medium"
          />
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          {isEditProposal
            ? t("chatbot.updateRecipePrompt")
            : t("chatbot.saveRecipePrompt")}
        </div>

        <DialogFooter className="flex-row w-full gap-2">
          <DialogClose className="w-full">
            <Button variant="secondary" className="w-full">
              {t("common.cancel")}
            </Button>
          </DialogClose>

          <Button
            className="w-full"
            variant="accent"
            onClick={() => {
              if (isEditProposal && editRecipeId) {
                onSaveEdit(
                  editRecipeId,
                  finalTitle,
                  finalDescription,
                  finalCategory,
                );
              } else {
                onSaveNew(finalTitle, finalDescription, finalCategory);
              }
            }}
          >
            {isEditProposal ? t("common.update") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [selectedImagesAsbase64, setSelectedImagesAsbase64] = useState<
    string[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePickImagesClick = async () => {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      saveToGallery: false,
      promptLabelHeader: t("common.cameraPrompt.header"),
      promptLabelCancel: t("common.cameraPrompt.cancel"),
      promptLabelPhoto: t("common.cameraPrompt.photo"),
      promptLabelPicture: t("common.cameraPrompt.picture"),
    });

    if (!image.base64String) {
      return;
    }

    setSelectedImagesAsbase64((prev) => [...prev, image.base64String!]);
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
      content: inputValue || "",
      images: selectedImagesAsbase64,
      ...(isFirstMessageWithContext && { recipeName: recipeContext.name }),
    };

    dispatch(addMessage(userMessage));
    setInputValue("");
    setSelectedImagesAsbase64([]);
    // Clear recipe context from URL after first message (like images)
    if (isFirstMessageWithContext) {
      setSearchParams({});
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

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: {
          previous_response_id: previousResponseId,
          // Responses API accepts an array of messages with mixed content parts
          messages: [
            {
              role: "user",
              content: parts,
            },
          ],
        },
      });

      if (error) {
        console.error("Message: ", error.message);
        throw error;
      }

      console.log("Chatbot response:", data);

      const newMessage: ChatMessage = {
        role: "assistant",
        content: data.output_text,
        toolOutputsForUI: JSON.parse(data.tool_outputs_for_ui),
      };

      dispatch(setPreviousResponseId(data.id));
      dispatch(addMessages([newMessage]));
    } catch (error) {
      console.error("Error calling chatbot function:", error);

      const errorMessage: ChatMessage = {
        content: t("chatbot.errorMessage"),
        role: "assistant",
      };

      dispatch(addMessage(errorMessage));
    } finally {
      dispatch(setIsTyping(false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    dispatch(resetChat());
    setInputValue("");
    setSelectedImagesAsbase64([]);
  };

  function handleMessageSuggestionButton(suggestion: string) {
    setInputValue(suggestion);
  }

  async function saveSuggestedRecipe(
    title: string,
    description: string,
    category: string,
  ) {
    let categoryId = getCategoryIdByTranslatedEnglishName(category);

    if (categoryId === null) {
      console.error("Invalid category:", category);
      categoryId = 5;
    }

    if (!householdId) {
      alert(t("chatbot.saveRecipeError"));
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
      navigate(`/recipe/${newRecipe.id}`);
    } catch (error) {
      console.error(error);
      alert(t("chatbot.saveRecipeError"));
    }
  }

  async function saveEditedRecipe(
    recipeId: number,
    title: string,
    description: string,
    category: string,
  ) {
    console.log("Updating recipe:", recipeId, title, category);
    let categoryId = getCategoryIdByTranslatedEnglishName(category);

    if (categoryId === null) {
      console.error("Invalid category:", category);
      categoryId = 5;
    }

    try {
      await updateRecipeMutation.mutateAsync({
        recipeId,
        name: title,
        description,
        link: recipeContext?.link ?? "",
        category: categoryId,
      });
      navigate(`/recipe/${recipeId}`);
    } catch (error) {
      console.error(error);
      alert(t("chatbot.updateRecipeError"));
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
            <h2 className="first-font text-xl font-bold">
              {t("chatbot.greeting")}
            </h2>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              className="rounded-full"
              variant="secondary"
              size="sm"
              onClick={() =>
                handleMessageSuggestionButton(
                  t("chatbot.suggestions.suggestion1.text"),
                )
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
                  handleMessageSuggestionButton(
                    t("chatbot.suggestions.suggestion2.text"),
                  )
                }
              >
                {t("chatbot.suggestions.suggestion2.label")}
              </Button>

              <Button
                className="rounded-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleMessageSuggestionButton(
                    t("chatbot.suggestions.suggestion3.text"),
                  )
                }
              >
                {t("chatbot.suggestions.suggestion3.label")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {visibleMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-start gap-2 ${
                message.role === "user"
                  ? "flex-row-reverse max-w-[80%]"
                  : "flex-row w-full"
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-lg max-w-full px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" && (
                  <>
                    {/* Recipe context chip if present */}
                    {"recipeName" in message && (message as any).recipeName && (
                      <div className="text-background border border-dashed border-background text-center py-[0.5px] px-4 font-medium second-font rounded mb-2">
                        {(message as any).recipeName}
                      </div>
                    )}

                    <p className="text-sm">{message.content}</p>

                    {/* optional images if present */}
                    {"images" in message &&
                      Array.isArray((message as any).images) &&
                      (message as any).images.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(message as any).images.map(
                            (src: string, i: number) => (
                              <img
                                key={i}
                                src={`data:image/jpeg;base64,${src}`}
                                srcSet={`data:image/jpeg;base64,${src}`}
                                alt={`upload-${i}`}
                                className="rounded-md border w-16 h-16 object-cover"
                              />
                            ),
                          )}
                        </div>
                      )}
                  </>
                )}

                {message.role === "assistant" && (
                  <MarkdownRenderer
                    content={message.content}
                    className="text-sm"
                  />
                )}

                {message.role === "assistant" &&
                  message.toolOutputsForUI &&
                  message.toolOutputsForUI.length > 0 && (
                    <RecipeProposalDialog
                      toolOutput={message.toolOutputsForUI[0]}
                      onSaveNew={saveSuggestedRecipe}
                      onSaveEdit={saveEditedRecipe}
                      t={t}
                    />
                  )}
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

        <div className="flex items-end gap-2">
          {/* tiny image button */}

          <Field>
            <InputGroup>
              <InputGroupTextarea
                placeholder={t("chatbot.inputPlaceholder")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                onSubmit={handleSendMessage}
                maxLength={3000}
                rows={1}
              />

              <InputGroupAddon align="block-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handlePickImagesClick}
                  title={t("common.uploadImage")}
                  className="rounded-full"
                >
                  <ImagePlus className="w-5 h-5" />
                </Button>

                <Button
                  type="button"
                  variant="accent"
                  size="icon"
                  onClick={handleSendMessage}
                  title={t("common.send")}
                  className="ml-auto rounded-full"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </div>
    </Layout>
  );
}
