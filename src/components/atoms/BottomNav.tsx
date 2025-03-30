import { NavLink } from "react-router";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useTranslation } from "react-i18next";
import { Bookmark, BookOpenText, CalendarDays, ScrollText } from "lucide-react";

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <>
      <div style={{ height: "100px" }}></div>

      <div className="w-full max-w-lg fixed bottom-0 pb-2 bg-background z-20">
        <Separator className="mb-2" />

        <div className="flex justify-between w-full gap-1 px-2">
          <NavLink to="/" className="w-full">
            {({ isActive }) => (
              <Button
                className={
                  (isActive ? "bg-gray-700 hover:bg-gray-700" : "") + " w-full"
                }
              >
                {t("bottomNav.shoppingList")}

                <ScrollText />
              </Button>
            )}
          </NavLink>

          <NavLink to="/mealplanner" className="w-full">
            {({ isActive }) => (
              <Button
                className={
                  (isActive ? "bg-gray-700 hover:bg-gray-700" : "") + " w-full"
                }
              >
                {t("bottomNav.planner")}

                <CalendarDays />
              </Button>
            )}
          </NavLink>

          <NavLink to="/discover" className="w-full">
            {({ isActive }) => (
              <Button
                className={
                  (isActive ? "bg-gray-700 hover:bg-gray-700" : "") + " w-full"
                }
              >
                {t("bottomNav.recipes")}

                <BookOpenText />
              </Button>
            )}
          </NavLink>

          <NavLink to="/bookmarks" className="w-full">
            {({ isActive }) => (
              <Button
                className={
                  (isActive ? "bg-gray-700 hover:bg-gray-700" : "") + " w-full"
                }
              >
                {t("bottomNav.bookmarks")}

                <Bookmark />
              </Button>
            )}
          </NavLink>
        </div>
      </div>
    </>
  );
}
