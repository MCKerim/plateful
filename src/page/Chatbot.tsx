import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { Input } from "../components/ui/input";
import Layout from "../components/layout/Layout";
import supabase from "../utils/supabase";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      content:
        "Hello! I'm your Plateful cooking assistant. How can I help you today? I can help with recipes, meal planning, cooking tips, and more!",
      role: "assistant",
    },
  ]);
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
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { messages: updatedMessages },
      });

      if (error) {
        console.error('Message: ', error.message);
        throw error;
      }

      console.log('Chatbot response:', data);

      const botMessage: Message = {
        content: data?.message.content || "Sorry, I encountered an error. Please try again.",
        role: data?.message.role || "assistant",
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling chatbot function:', error);
      
      const errorMessage: Message = {
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
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
      <div className="flex flex-col h-[calc(100vh-140px)] w-full">
        {/* Chat Header */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>

          <h2 className="font-bold text-lg">Cooking Assistant</h2>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
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
                  <p className="text-sm">{message.content}</p>
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
        <Input
          className="w-full rounded-full flex-1"
          type="text"
          placeholder="Ask me about recipes or cooking tips..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          onSubmit={handleSendMessage}
          showSubmitButton
        />
      </div>
    </Layout>
  );
}
