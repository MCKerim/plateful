import { Bot } from "lucide-react";
import { Button } from "../ui/button";
import { NavLink } from "react-router";

export default function ChatbotFAB() {
  return (
    <NavLink
      to="/chatbot"
      className="fixed bottom-24 right-4 z-30"
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
      >
        <Bot size={24} />
      </Button>
    </NavLink>
  );
}
