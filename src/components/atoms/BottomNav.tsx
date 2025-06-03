import { Separator } from "../ui/separator";
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
            icon="scrollText"
            link="/shoppinglist"
            active={window.location.pathname.startsWith("/shoppinglist")}
          />

          <BottomNavButton
            label={t("bottomNav.planner")}
            icon="calendarDays"
            link="/mealplanner"
            active={window.location.pathname.startsWith("/mealplanner")}
          />

          <BottomNavButton
            label={t("bottomNav.recipes")}
            icon="bookOpenText"
            link="/discover"
            active={
              window.location.pathname.startsWith("/discover") ||
              window.location.pathname.startsWith("/recipe")
            }
          />

          <BottomNavButton
            label={t("bottomNav.home")}
            icon="bookmark"
            link="/bookmarks"
            active={window.location.pathname.startsWith("/bookmarks")}
          />
        </div>
      </div>
    </>
  );
}
