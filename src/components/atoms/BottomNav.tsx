import { NavLink } from "react-router";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Bookmark, BookOpenText, CalendarDays, ScrollText } from "lucide-react";

export default function BottomNav() {
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
                <ScrollText />

                Liste
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
                <CalendarDays />

                Plan
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
                <BookOpenText />

                Rezepte
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
                <Bookmark />

                Gemerkt
              </Button>
            )}
          </NavLink>
        </div>
      </div>
    </>
  );
}
