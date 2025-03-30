import { Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { NavLink } from "react-router";

export default function Header() {
  return (
    <>
      <div style={{ height: "64px" }}></div>

      <div className="w-full max-w-lg fixed top-0 pt-2 bg-background">
        <div className="flex justify-between w-full items-center px-2">
          <h1 className="font-bold text-2xl">Plateful</h1>

          <NavLink to="/settings">
            <Button variant="outline" size="icon">
              <Settings />
            </Button>
          </NavLink>
        </div>

        <Separator className="mt-2" />
      </div>
    </>
  );
}
