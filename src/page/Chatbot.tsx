import { useState, useRef, useEffect } from "react";
import { RotateCcw, ImagePlus } from "lucide-react";
import Layout from "../components/layout/Layout";
import MarkdownRenderer from "../components/atoms/MarkdownRenderer";
import { Input } from "@/components/ui/input";
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
import { useNavigate } from "react-router";
import Rive from "@rive-app/react-canvas";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/utils/supabase";
import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type VisionPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export default function Chatbot() {
  const { supabase } = useSupabase();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const householdId = useAppSelector(selectHouseholdId);

  const messages = useAppSelector(selectMessages);
  const previousResponseId = useAppSelector(selectPreviousResponseId);
  const isTyping = useAppSelector(selectIsTyping);
  const visibleMessages = useAppSelector(selectVisibleMessages);

  const [inputValue, setInputValue] = useState("");
  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fileToDataURL(file: File): Promise<string> {
    // Keeps EXIF and content type
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const b64 = btoa(binary);
    const mime = file.type || "image/png";
    return `data:${mime};base64,${b64}`;
  }

  const handlePickImagesClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Convert to data URLs
    const asDataUrls = await Promise.all(files.map(fileToDataURL));
    // Keep a small cap to avoid huge payloads
    const capped = asDataUrls.slice(0, 4);
    setImageDataUrls(prev => [...prev, ...capped].slice(0, 4));
    // Clear input so same file can be uploaded again later
    e.target.value = "";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && imageDataUrls.length === 0) return;

    // Show the user message in the UI right away
    const userMessage: ChatMessage & { images?: string[] } = {
      role: "user",
      content: inputValue || "Sent image",
      images: imageDataUrls,
    };

    dispatch(addMessage(userMessage));
    setInputValue("");
    setImageDataUrls([]);
    dispatch(setIsTyping(true));

    try {
      // Build vision content parts for the server
      const parts: VisionPart[] = [];
      if (inputValue.trim()) {
        parts.push({ type: "input_text", text: inputValue.trim() });
      }
      for (const url of userMessage.images || []) {
        parts.push({ type: "input_image", image_url: url });
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

      const errorMessage: ChatMessage  = {
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
    setImageDataUrls([]);
  };

  function handleMessageSuggestionButton(suggestion: string) {
    setInputValue(suggestion);
  }

  async function saveSuggestedRecipe(title: string, description: string) {
    // Insert new recipe
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        { name: title, description, link: null, household_id: householdId },
      ])
      .select();

    if (!error && data) {
      navigate(`/recipe/${data[0].id}`);
    } else {
      console.error(error);
      alert(t("chatbot.saveRecipeError"));
    }
  }

  return (
    <Layout
      headerButtons={
        <Button onClick={handleResetChat} variant="ghost" size="icon">
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
                  t("chatbot.suggestions.suggestion1.text")
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
                    t("chatbot.suggestions.suggestion2.text")
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
                    t("chatbot.suggestions.suggestion3.text")
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
                    <p className="text-sm">{message.content}</p>
                    {/* optional thumbnails if present */}
                    {"images" in message && Array.isArray((message as any).images) && (message as any).images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {(message as any).images.map((src: string, i: number) => (
                          <img
                            key={i}
                            src={src}
                            alt={`upload-${i}`}
                            className="rounded-md border w-16 h-16 object-cover"
                          />
                        ))}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2 max-w-full"
                        >
                          <span className="truncate">
                            {message.toolOutputsForUI[0].args.title}
                          </span>
                        </Button>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {message.toolOutputsForUI[0].args.title}
                          </DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="max-h-[60vh] rounded-md border p-2">
                          <MarkdownRenderer
                            content={
                              message.toolOutputsForUI[0].args.description || ""
                            }
                            className="font-medium"
                          />
                        </ScrollArea>

                        <DialogFooter className="flex-row w-full gap-2">
                          <DialogClose className="w-full">
                            <Button variant="secondary" className="w-full">
                              {t("common.cancel")}
                            </Button>
                          </DialogClose>

                          <Button
                            className="w-full"
                            onClick={() =>
                              saveSuggestedRecipe(
                                message.toolOutputsForUI[0].args.title ?? "",
                                message.toolOutputsForUI[0].args.description ??
                                  ""
                              )
                            }
                          >
                            {t("common.save")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
        <div className="flex items-center gap-2">
          {/* tiny image button */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handlePickImagesClick}
            title={t("common.uploadImage") as string}
          >
            <ImagePlus className="w-5 h-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
            capture="environment"
          />

          <Input
            type="text"
            className="flex-1 w-full rounded-full"
            showSubmitButton
            placeholder={t("chatbot.inputPlaceholder")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            onSubmit={handleSendMessage}
            maxLength={200}
          />
        </div>

        {/* small strip of selected image previews before sending */}
        {imageDataUrls.length > 0 && (
          <div className="flex gap-2 mt-2">
            {imageDataUrls.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`preview-${i}`}
                className="rounded-md border w-12 h-12 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
