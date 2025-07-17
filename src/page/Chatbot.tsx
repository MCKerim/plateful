import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import Layout from "../components/layout/Layout";
import MarkdownRenderer from "../components/atoms/MarkdownRenderer";
import supabase from "../utils/supabase";
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
  resetChat 
} from "@/redux/slices/chatbotSlice";
import { useNavigate } from "react-router";
import Rive from "@rive-app/react-canvas";

export default function Chatbot() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const householdId = useAppSelector(selectHouseholdId);
  const messages = useAppSelector(selectMessages);
  const isTyping = useAppSelector(selectIsTyping);
  const visibleMessages = useAppSelector(selectVisibleMessages);
  
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: any = {
      content: inputValue,
      role: "user",
    };
    
    dispatch(addMessage(userMessage));
    setInputValue("");
    dispatch(setIsTyping(true));

    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { messages: [...messages, userMessage] },
      });

      if (error) {
        console.error("Message: ", error.message);
        throw error;
      }

      console.log("Chatbot response:", data);

      const newMessages: any[] = [];
      data.newMessages.forEach((msg: any) => {
        newMessages.push(msg);
      });

      dispatch(addMessages(newMessages));
    } catch (error) {
      console.error("Error calling chatbot function:", error);

      const errorMessage: any = {
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
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
  };

  function handleMessageSuggestionButton(suggestion: string) {
    setInputValue(suggestion);
  }

  async function saveSuggestedRecipe(functionArguments: any) {
    const { title, description } = JSON.parse(functionArguments);

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
      alert("An error occurred. Please try again.");
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
        <div className="absolute w-full gap-2 flex-col justify-center items-center left-1/2 -translate-x-1/2 -z-10">
          <div className="w-full h-[200px] mx-auto">
              <Rive src="/plateful-character.riv" artboard="Fly-In" />
          </div>

          <div className="w-full gap-2 mb-6 flex justify-center items-center">
            <h2 className="font-bold text-xl">Wie kann ich dir helfen?</h2>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              className="rounded-full"
              variant="secondary"
              size="sm"
              onClick={() =>
                handleMessageSuggestionButton("Erstelle ein gesundes Rezept")
              }
            >
              Erstelle ein gesundes Rezept
            </Button>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                className="rounded-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleMessageSuggestionButton("Erstelle ein schnelles Rezept")
                }
              >
                ein schnelles Rezept
              </Button>

              <Button
                className="rounded-full"
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleMessageSuggestionButton("Erstelle ein günstiges Rezept")
                }
              >
                ein günstiges Rezept
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
                  className={`rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "user" && (
                    <p className="text-sm">{message.content}</p>
                  )}

                  {message.role === "assistant" && (
                    <MarkdownRenderer
                      content={message.content}
                      className="text-sm"
                    />
                  )}

                  {message.role === "assistant" &&
                    message.tool_calls && message.tool_calls.length > 0 && (
                      <Button
                        onClick={() =>
                          saveSuggestedRecipe(
                            message.tool_calls![0].function.arguments
                          )
                        }
                      >
                        Rezept speichern
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[80%]">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`w-full max-w-lg fixed z-10 pr-8 bottom-20`}>
        <Input
          type="text"
          className="w-full rounded-full flex-1"
          showSubmitButton
          placeholder="Frag mich nach Rezepten oder Tipps!"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          onSubmit={handleSendMessage}
        />
      </div>
    </Layout>
  );
}
