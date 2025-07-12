import { NavLink } from "react-router";
import { BookOpen, Bot, Calendar, House, List, Search } from "lucide-react";

type Props = {
  label: string;
  icon: "home" | "chatbot" | "explore" | "cookbook" | "planner" | "lists";
  link: string;
  active?: boolean;
};

export default function BottomNavButton({
  label,
  icon,
  link,
  active = false,
}: Readonly<Props>) {
  const ICON_SIZE = 22;

  function getIcon() {
    switch (icon) {
      case "home":
        return (
          <House size={ICON_SIZE} fill={active ? "currentColor" : "none"} />
        );
      case "chatbot":
        return <Bot size={ICON_SIZE} fill={active ? "currentColor" : "none"} />;
      case "explore":
        return <Search size={ICON_SIZE} strokeWidth={active ? 3 : 1.5} />;
      case "cookbook":
        return (
          <BookOpen size={ICON_SIZE} fill={active ? "currentColor" : "none"} />
        );
      case "planner":
        return (
          <Calendar size={ICON_SIZE} fill={active ? "currentColor" : "none"} />
        );
      case "lists":
        return <List size={ICON_SIZE} strokeWidth={active ? 3 : 1.5} />;
      default:
        return null;
    }
  }

  return (
    <NavLink
      to={link}
      className={`w-full align-middle items-center transition-colors duration-700 ease-out ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <div className="w-full flex justify-center">{getIcon()}</div>

      <p
        className={
          "w-full text-center text-xs mt-1 " + (active ? "font-bold" : "")
        }
      >
        {label}
      </p>
    </NavLink>
  );
}
