import { Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { NavLink } from "react-router";

export default function Header() {
  return (
    <>
      <div style={{ height: "54px" }}></div>

      <div className="w-full max-w-lg fixed top-0 pt-1 bg-background z-20">
        <div className="flex justify-between w-full items-center px-2">
          <h1 className="font-bold text-xl">Plateful</h1>

          <NavLink to="/settings">
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </NavLink>
        </div>

        <Separator />
      </div>
    </>
  );
}
