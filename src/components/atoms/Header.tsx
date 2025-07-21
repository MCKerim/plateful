import { Settings } from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { NavLink } from "react-router";

type Props = {
  buttons?: React.ReactNode;
};

export default function Header({ buttons }: Readonly<Props>) {
  const environment = import.meta.env.VITE_NODE_ENV;

  return (
    <>
      <div style={{ height: "54px" }}></div>

      <div className="w-full max-w-lg fixed top-0 pt-1 bg-background z-20">
        <div className="flex justify-between w-full items-center px-2">
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-xl">Plateful</h1>

            <div className="text-xs font-bold bg-accent text-accent-foreground py-0.5 px-2 rounded-full">
              Beta
            </div>

            {environment === "preview" && (
              <div className="text-xs font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full">
                Preview
              </div>
            )}

            {environment === "development" && (
              <div className="text-xs font-bold bg-primary text-primary-foreground py-0.5 px-2 rounded-full">
                Development
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {buttons}

            <NavLink to="/settings">
              <Button variant="ghost" size="icon">
                <Settings />
              </Button>
            </NavLink>
          </div>
        </div>

        <Separator />
      </div>
    </>
  );
}
