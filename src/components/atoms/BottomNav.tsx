import { NavLink } from "react-router";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export default function BottomNav() {
  return (
    <>
      <div style={{ height: "100px" }}></div>
      <div className="w-full max-w-lg fixed bottom-0 pb-2 bg-background">
        <Separator className="mb-2" />

        <div className="flex justify-between w-full gap-1 px-2">
          <NavLink to="/" className="w-full">
            {({ isActive }) => (
              <Button
                className={
                  (isActive ? "bg-gray-700 hover:bg-gray-700" : "") + " w-full"
                }
              >
                1
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
                2
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
                3
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
                4
              </Button>
            )}
          </NavLink>
        </div>
      </div>
    </>
  );
}
