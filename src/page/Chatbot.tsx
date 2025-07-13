import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import Layout from "../components/layout/Layout";
import MarkdownRenderer from "../components/atoms/MarkdownRenderer";
import supabase from "../utils/supabase";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      content: inputValue,
      role: "user",
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { messages: updatedMessages },
      });

      if (error) {
        console.error("Message: ", error.message);
        throw error;
      }

      console.log("Chatbot response:", data);

      const botMessage: Message = {
        content:
          data?.message.content ||
          "Sorry, I encountered an error. Please try again.",
        role: data?.message.role || "assistant",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling chatbot function:", error);

      const errorMessage: Message = {
        content:
          "Sorry, I'm having trouble connecting right now. Please try again later.",
        role: "assistant",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Layout>
      {/* Chat BG */}
      {messages.length === 0 && (
        <div className="w-full absolute gap-2 flex justify-center items-center top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 -z-10">
          <div className="flex items-center justify-center pb-2">
            <Bot className="w-8 h-8 text-primary" />
          </div>

          <h2 className="font-bold text-xl">Wie kann ich dir helfen?</h2>
        </div>
      )}

      {/* Messages Container */}
      <div className="overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {messages.map((message, index) => (
          <div
            key={index}
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
                {message.role === "user" ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <MarkdownRenderer
                    content={message.content}
                    className="text-sm"
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
