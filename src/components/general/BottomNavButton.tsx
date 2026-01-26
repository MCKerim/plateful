import { NavLink } from "react-router";
import { BookOpen, Bot, Calendar, House, List, Search } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  label: string;
  icon: "home" | "chatbot" | "explore" | "cookbook" | "planner" | "lists";
  link: string;
  active?: boolean;
  onClick?: () => void;
};

export default function BottomNavButton({
  label,
  icon,
  link,
  active = false,
  onClick = () => {},
}: Readonly<Props>) {
  const ICON_SIZE = 22;

  function getIcon() {
    switch (icon) {
      case "home":
        return <House size={ICON_SIZE} fill={active ? "currentColor" : "none"} />;
      case "chatbot":
        return <Bot size={ICON_SIZE} fill={active ? "currentColor" : "none"} />;
      case "explore":
        return <Search size={ICON_SIZE} strokeWidth={active ? 3 : 1.5} />;
      case "cookbook":
        return <BookOpen size={ICON_SIZE} fill={active ? "currentColor" : "none"} />;
      case "planner":
        return <Calendar size={ICON_SIZE} fill={active ? "currentColor" : "none"} />;
      case "lists":
        return <List size={ICON_SIZE} strokeWidth={active ? 3 : 1.5} />;
      default:
        return null;
    }
  }

  return (
    <NavLink
      to={link}
      className={`w-full align-middle items-center ${
        active ? "text-secondary-foreground" : "text-muted-foreground"
      }`}
      onClick={onClick}
    >
      <motion.div
        className="flex flex-col items-center justify-center w-full"
        whileTap={{ scale: 0.9, transition: { duration: 0.15, ease: "easeOut" } }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div
          animate={{ y: active ? -2 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {getIcon()}
        </motion.div>

        <motion.p
          className="w-full text-center text-xs mt-1"
          animate={{
            fontWeight: active ? 600 : 400,
            opacity: active ? 1 : 0.8,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.p>
      </motion.div>
    </NavLink>
  );
}
