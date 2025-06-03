import { NavLink } from "react-router";
import { Bookmark, BookOpenText, CalendarDays, ScrollText } from "lucide-react";

type Props = {
  label: string;
  icon: "bookmark" | "bookOpenText" | "calendarDays" | "scrollText";
  link: string;
  active?: boolean;
};

export default function BottomNavButton({
  label,
  icon,
  link,
  active = false,
}: Readonly<Props>) {
  function getIcon() {
    switch (icon) {
      case "bookmark":
        return <Bookmark strokeWidth={active ? 2.25 : 2} />;
      case "bookOpenText":
        return <BookOpenText strokeWidth={active ? 2.25 : 2} />;
      case "calendarDays":
        return <CalendarDays strokeWidth={active ? 2.25 : 2} />;
      case "scrollText":
        return <ScrollText strokeWidth={active ? 2.25 : 2} />;
      default:
        return null;
    }
  }

  return (
    <NavLink to={link} className="w-full align-middle items-center">
      <div className="w-full flex justify-center font-bold">{getIcon()}</div>

      <p
        className={
          "w-full text-center text-sm " + (active ? "font-bold" : "font-medium")
        }
      >
        {label}
      </p>
    </NavLink>
  );
}
