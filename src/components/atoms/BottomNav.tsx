import { Separator } from "../ui/separator";
import { Bookmark, BookOpenText, CalendarDays, ScrollText } from "lucide-react";
import BottomNavButton from "./BottomNavButton";
import { useTranslation } from "react-i18next";

export default function BottomNav() {
  const { t } = useTranslation();
  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="w-full max-w-lg fixed bottom-0 pb-2 bg-background z-20">
        <Separator className="mb-2" />

        <div className="flex justify-between w-full gap-1 px-2">
          <BottomNavButton
            label={t("bottomNav.list")}
            icon={<ScrollText />}
            link="/shoppinglist"
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon={<CalendarDays />}
            link="/mealplanner"
          />

          <BottomNavButton
            label={t("bottomNav.recipes")}
            icon={<BookOpenText />}
            link="/discover"
          />

          <BottomNavButton
            label={t("bottomNav.home")}
            icon={<Bookmark />}
            link="/bookmarks"
          />
        </div>
      </div>
    </>
  );
}
